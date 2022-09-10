import { RunService } from "@rbxts/services";
import { ReplicationMode } from "../../global/Enums";
import { LeafNode } from "../nodes/Leaf";
import { ScopeIndex } from "../nodes/RestrictedScope";
import { StateNode } from "../nodes/StateNode";
import { SignablePacket, Unsigned, Wrapped } from "./Packet";

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

	export class ReplicationOptions {
		private mode: ReplicationMode = ReplicationMode.All;

		private scope: ScopeIndex = ScopeIndex.PUBLIC_SERVER;
		private scopeOwner?: Player;

		private owner: StateNode;

		private whitelist: Player[] = [];
		private blacklist: Player[] = [];

		private predicate: (plr: Player) => boolean = () => true;

		private readonly networkQueue: Wrapped<Unsigned<SignablePacket>>[] = [];

		public constructor(owner: StateNode) {
			this.owner = owner;
		}

		public getNetworkQueue() {
			return this.networkQueue;
		}

		public clearNetworkQueue() {
			this.networkQueue.clear();
		}

		public setMode(mode: ReplicationMode) {
			this.mode = mode;
		}

		public getMode() {
			this.mode;
		}

		public setScope(scope: ScopeIndex) {
			this.scope = scope;
		}

		public getScope() {
			return this.scope;
		}

		public setScopeOwner(plr: Player) {
			this.scopeOwner = plr;
		}

		public addSubscription() {}

		/** @server @hidden */
		public _internal_shouldReplicateFor(plr: Player) {
			if (RunService.IsClient()) return false;
			if (this.scope === ScopeIndex.PUBLIC_SERVER) {
				if (this.mode === ReplicationMode.All) {
					return true;
				}
				if (this.mode === ReplicationMode.Whitelist) {
					return this.whitelist.includes(plr);
				}
				if (this.mode === ReplicationMode.Blacklist) {
					return !this.blacklist.includes(plr);
				}
				if (this.mode === ReplicationMode.Predicate) {
					return this.predicate(plr);
				}
			}
			if (this.scope === ScopeIndex.PRIVATE_SERVER) {
				return false;
			}
			if (this.scope === ScopeIndex.PUBLIC_CLIENT) {
				if (this.mode === ReplicationMode.All) {
					return true;
				}
				if (this.mode === ReplicationMode.Whitelist) {
					return this.whitelist.includes(plr);
				}
				if (this.mode === ReplicationMode.Blacklist) {
					return !this.blacklist.includes(plr);
				}
				if (this.mode === ReplicationMode.Predicate) {
					return this.predicate(plr);
				}
			}
			if (this.scope === ScopeIndex.PRIVATE_CLIENT) {
				return false;
			}
		}

		/** @server @hidden */
		public _internal_shouldAllowClientWrite(plr: Player) {
			if (this.scope === ScopeIndex.PUBLIC_SERVER) {
				return false;
			}
			if (this.scope === ScopeIndex.PRIVATE_SERVER) {
				return false;
			}
			if (this.scope === ScopeIndex.PUBLIC_CLIENT) {
				// TODO: Allow to write sometimes.
				return true;
			}
			if (this.scope === ScopeIndex.PRIVATE_CLIENT) {
				return true;
			}
		}
	}
}
