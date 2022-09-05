import { RunService } from "@rbxts/services";
import { ROAST } from "../../..";
import { ReplicationMode } from "../../global/Enums";
import { Definition } from "../definitions";
import { BranchNode } from "../nodes/Branch";
import { LeafNode } from "../nodes/Leaf";
import { ScopeIndex } from "../nodes/RestrictedScope";
import { StateNode } from "../nodes/StateNode";

export type SubscriptionRejected = (reason: string) => void;
export type SubscriptionResolved = (e: any) => void;
export type NodeSubscriptionFunction<T> = (val: T) => void;

enum subtype {
	THEN,
	CATCH,
	FAILED
}

export type KeyedHandler<T> = [subtype, T];

export class Middleware<T> {
	public readonly name = "";

	public constructor(name: string, handler: (LeafNode<T>) => void) {
 
	}
}

export class NodeSubscription<V, T extends LeafNode<V>> {
	readonly middleware: Array<Middleware> = new Array();
	handlers: KeyedHandler<NodeSubscriptionFunction<T>>[] = [];

	/** @hidden */
	public fire() {}
}

export class NodeSubscriptionBuilder {
	public static build() {
		return new NodeSubscription();
	}
}


Node.Subscribe([ROAST.SanityCheck.Position]);

let sub = NodeSubscriptionBuilder.build()
.then()
.catch()





	// .Subscribe([ROAST.SanityCheck.Position])
	// .then((val: LeafNode<number>) => {
	// 	let 
	// })
	// .catch(() => {})
	// .then()
	// .then();

export namespace Replication {
	export class ReplicationOptions {
		private mode: ReplicationMode = ReplicationMode.All;

		private scope: ScopeIndex = ScopeIndex.PUBLIC_SERVER;
		private scopeOwner?: Player;

		private owner: StateNode;

		private whitelist: Player[] = [];
		private blacklist: Player[] = [];

		private predicate: (plr: Player) => boolean = () => true;

		public constructor(owner: StateNode) {
			this.owner = owner;
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
			if (this.scope === ScopeIndex.NEED_TO_KNOW) {
				return false; // TODO: Fix this.
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
			if (this.scope === ScopeIndex.NEED_TO_KNOW) {
				return false; // TODO: Fix this.
			}
		}
	}
}
