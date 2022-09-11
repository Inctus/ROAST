import { Players, RunService } from "@rbxts/services";
import { ReplicationMode } from "../../global/Enums";
import { LeafNode } from "../nodes/Leaf";
import { ScopeIndex } from "../nodes/RestrictedScope";
import { NetworkActor, Packet, SignablePacket, Unsigned, Wrapped } from "./Packet";

export type SubscriptionRejected = (reason: string) => void;
export type SubscriptionResolved = (e: any) => void;
export type NodeSubscriptionFunction<T> = (val: T) => void;

enum subtype {
	THEN,
	CATCH,
	FAILED,
}

export type KeyedHandler<T> = [subtype, T];

export class Middleware<T> {
	public readonly name = "";

	public constructor(name: string, handler: (node: LeafNode<T>) => void) {}
}

interface Receiver<T> {
	then<X>(v: (val: T) => X): Receiver<X>;

	catch<X>(v: (err: string) => X): Receiver<X>;
}

export class NodeSubscription<V, T extends LeafNode<V>> {
	readonly middleware: Array<Middleware<any>> = new Array();
	handlers: KeyedHandler<NodeSubscriptionFunction<T>>[] = [];

	/** @hidden */
	public fire() {}

	public then<X>(v: (val: V) => X): Receiver<X> {
		return this as unknown as Receiver<X>;
	}

	public catch<X>(v: (err: string) => X): Receiver<X> {
		return this as unknown as Receiver<X>;
	}
}

export class NodeSubscriptionBuilder {
	public static build<V>() {
		return new NodeSubscription<V, LeafNode<V>>();
	}
}

let sub = NodeSubscriptionBuilder.build<boolean>()
	.then((v: boolean) => {
		return 10;
	})
	.then((n: number) => {
		return "hello";
	})
	.then((v: string) => {
		throw "E!";
	})
	.catch((err: string) => {
		return 10;
	})
	.then((n: number) => {
		return 30;
	});

// .Subscribe([ROAST.SanityCheck.Position])
// .then((val: LeafNode<number>) => {
// 	let
// })
// .catch(() => {})
// .then()
// .then();

export namespace Replication {
	export function isReplicatableScope(scope: ScopeIndex): boolean {
		switch (scope) {
			case ScopeIndex.PUBLIC_CLIENT:
			case ScopeIndex.PUBLIC_SERVER:
				return true;
			default:
				return false;
		}
	}

	export function amOwnerContext(scope: ScopeIndex): boolean {
		if (RunService.IsServer()) {
			return (
				scope === ScopeIndex.PRIVATE_SERVER ||
				scope === ScopeIndex.PUBLIC_SERVER ||
				scope === ScopeIndex.PUBLIC_CLIENT
			);
		} else {
			return scope === ScopeIndex.PRIVATE_CLIENT;
		}
	}

	export function getActor(): NetworkActor {
		return RunService.IsServer() ? "server" : Players.LocalPlayer;
	}

	export class Replicator {
		constructor() {
			if (RunService.IsServer()) {
				Players.PlayerRemoving.Connect(this.removeSubscribedNetworkActor);
			}
		}

		private scope: ScopeIndex = ScopeIndex.UNASSIGNED;
		public setScope(scope: ScopeIndex) {
			this.scope = scope;
		}
		public getScope() {
			return this.scope;
		}

		private readonly networkQueue: Wrapped<Unsigned<SignablePacket>>[] = [];
		public getNetworkQueue() {
			return this.networkQueue;
		}
		public clearNetworkQueue() {
			this.networkQueue.clear();
		}
		public enqueuePacket(packet: Wrapped<Unsigned<SignablePacket>>) {
			this.networkQueue.push(packet);
		}
		public distributeUpdate(value: any, source: NetworkActor) {
			if (Replication.amOwnerContext(this.scope)) {
				this.enqueuePacket(
					Packet.Update(
						this.getTargetNetworkActors().filter((a) => a !== source),
						value,
					),
				);
			}
		}

		private readonly subscribedNetworkActors: NetworkActor[] = [];
		public addSubscribedNetworkActor(actor: NetworkActor) {
			if (!this.subscribedNetworkActors.includes(actor)) {
				this.subscribedNetworkActors.push(actor);
			}
		}
		private removeSubscribedNetworkActor(actor: NetworkActor) {
			if (
				this.subscribedNetworkActors.size() > 0 &&
				this.subscribedNetworkActors.includes(actor)
			) {
				this.subscribedNetworkActors.remove(
					this.subscribedNetworkActors.indexOf(actor),
				);
			}
		}
		public getTargetNetworkActors() {
			switch (this.mode) {
				case ReplicationMode.ALL:
					return this.subscribedNetworkActors;
				case ReplicationMode.NONE:
					return [];
				case ReplicationMode.PREDICATE:
					return Players.GetPlayers().filter(
						(p) =>
							this.predicate(p) && this.subscribedNetworkActors.includes(p),
					);
			}
		}

		private mode: ReplicationMode = ReplicationMode.ALL;
		public predicate: (plr: Player) => boolean = () => true;
		public setMode(mode: ReplicationMode): this {
			this.mode = mode;
			return this;
		}
		public getMode(): ReplicationMode {
			return this.mode;
		}
	}
}
