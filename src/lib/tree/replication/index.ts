import { Players, RunService } from "@rbxts/services";
import { ReplicationMode } from "../../global/Enums";
import { LeafNode } from "../nodes/Leaf";
import { ScopeIndex } from "../nodes/RestrictedScope";
import { StateNode } from "../nodes/StateNode";
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
	handlers: KeyedHandler<NodeSubscriptionFunction<V>>[] = [];

	/** @hidden */
	public fire() {}

	public then<X>(v: (val: V) => X): Receiver<X> {
		this.handlers.push([subtype.THEN, v]);
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

// .Subscribe([ROAST.SanityCheck.Position])
// .then((val: LeafNode<number>) => {
// 	let
// })
// .catch(() => {})
// .then()
// .then();

export namespace Replication {
	export function replicates(scope: ScopeIndex): boolean {
		switch (scope) {
			case ScopeIndex.PUBLIC_CLIENT:
			case ScopeIndex.PUBLIC_SERVER:
				return true;
			default:
				return false;
		}
	}

	export function amOwnerActor(scope: ScopeIndex): boolean {
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

	export function getOwnerActor(scope: ScopeIndex) {
		return scope === ScopeIndex.PRIVATE_SERVER ||
			scope === ScopeIndex.PUBLIC_SERVER ||
			scope === ScopeIndex.PUBLIC_CLIENT
			? "server"
			: Players.LocalPlayer;
	}

	export function isWritableActor(actor: NetworkActor, scope: ScopeIndex): boolean {
		switch (scope) {
			case ScopeIndex.PRIVATE_CLIENT:
				return actor === Players.LocalPlayer;
			case ScopeIndex.PRIVATE_SERVER:
			case ScopeIndex.PUBLIC_SERVER:
				return actor === "server";
			case ScopeIndex.PUBLIC_CLIENT:
				// CHANGE THIS TO DETECT THE OWNER OF THE CURRENT BRANCH SOMEHOW
				return true;
			default:
				return false;
		}
	}

	export class Replicator<T extends StateNode> {
		private scope: ScopeIndex = ScopeIndex.UNASSIGNED;
		private readonly networkQueue: Wrapped<Unsigned<SignablePacket>>[] = [];
		private readonly subscribedNetworkActors: NetworkActor[] = [];
		private mode: ReplicationMode = ReplicationMode.ALL;
		private predicate: (plr: Player) => boolean = () => true;

		/**
		 * Constructs a new Replicator for a Node
		 * @hidden
		 */
		constructor(private readonly node: T) {
			if (RunService.IsServer()) {
				Players.PlayerRemoving.Connect((p) =>
					this.removeSubscribedNetworkActor(p),
				);
			}
		}

		/**
		 * Assigns the scope of the Replicator
		 * @param scope the scope to assign
		 * @hidden
		 */
		public setScope(scope: ScopeIndex): this {
			this.scope = scope;
			return this;
		}

		/**
		 * Gets the scope of the Replicator
		 * @returns the scope
		 * @hidden
		 */
		public getScope(): ScopeIndex {
			return this.scope;
		}

		/**
		 * Gives back the NetworkQueue
		 * @returns the network queue
		 * @hidden
		 */
		public getNetworkQueue(): Wrapped<Unsigned<SignablePacket>>[] {
			return this.networkQueue;
		}

		/**
		 * Clears the NetworkQueue
		 * @hidden
		 */
		public clearNetworkQueue(): this {
			this.networkQueue.clear();
			return this;
		}

		/**
		 * Enqueues a packet to the NetworkQueue
		 * @param packet the packet to enqueue
		 * @hidden
		 */
		public enqueuePacket(packet: Wrapped<Unsigned<SignablePacket>>): this {
			this.networkQueue.push(packet);
			return this;
		}

		/**
		 * Replicates an update to the network
		 * @param value The new value to replicate
		 * @param source The origin of the value update
		 */
		public replicateUpdateFrom(value: any, source: NetworkActor): this {
			if (Replication.amOwnerActor(this.scope)) {
				// DISTRIBUTE UPDATE TO SUBSCRIBED NETWORK ACTORS
				this.enqueuePacket(
					Packet.Update(
						this.getTargetNetworkActors().filter((a) => a !== source),
						value,
					),
				);
			} else if (source !== Replication.getOwnerActor(this.scope)) {
				// DISTRIBUTE UPDATE TO OWNER FOR SANITY CHECK
				this.enqueuePacket(
					Packet.Update([Replication.getOwnerActor(this.scope)], value),
				);
			}
			return this;
		}

		/**
		 * Replicates an update to a specific NetworkActor
		 * @param value The new value to replicate
		 * @param target The target of the value update
		 */
		public replicateUpdateTo(value: any, target: NetworkActor): this {
			this.enqueuePacket(Packet.Update([target], value));
			return this;
		}

		/**
		 * Adds an Actor subscription to the Replicator
		 * @param actor The actor to subscribe
		 * @hidden
		 */
		public addSubscribedNetworkActor(actor: NetworkActor): this {
			if (!this.subscribedNetworkActors.includes(actor)) {
				this.subscribedNetworkActors.push(actor);
			}
			return this;
		}

		/**
		 * Removes an Actor subscription from the Replicator
		 * @param actor The actor to unsubscribe
		 * @hidden
		 */
		private removeSubscribedNetworkActor(actor: NetworkActor): this {
			if (
				this.subscribedNetworkActors.size() > 0 &&
				this.subscribedNetworkActors.includes(actor)
			) {
				this.subscribedNetworkActors.remove(
					this.subscribedNetworkActors.indexOf(actor),
				);
			}
			return this;
		}

		/**
		 * Gets the list of NetworkActors to target with updates
		 * @hidden
		 */
		public getTargetNetworkActors(): NetworkActor[] {
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

		/**
		 * Sets the mode of replication
		 * @param mode The mode to set
		 * @returns The Replicator
		 */
		public setMode(mode: ReplicationMode): this {
			this.mode = mode;
			return this;
		}

		public getMode(): ReplicationMode {
			return this.mode;
		}

		public setPredicate(predicate: (plr: Player) => boolean): this {
			assert(this.mode === ReplicationMode.PREDICATE, "Invalid mode");
			this.predicate = predicate;
			return this;
		}
	}
}
