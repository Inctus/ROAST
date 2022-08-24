import { RunService } from "@rbxts/services";
import { ReplicationMode } from "../../global/Enums";
import { ScopeIndex } from "../nodes/RestrictedScope";
import { StateNode } from "../nodes/StateNode";

export namespace Replication {
	export class ReplicationOptions {
		mode: ReplicationMode = ReplicationMode.All;
		scope: ScopeIndex = ScopeIndex.PUBLIC_SERVER;

		owner: StateNode;
		scopeOwner?: Player;

		whitelist: Player[] = [];
		blacklist: Player[] = [];

		predicate: (plr: Player) => boolean = () => true;

		public constructor(owner: StateNode) {
			this.owner = owner;
		}

		public setMode(mode: ReplicationMode) {
			this.mode = mode;
		}

		public setScope(scope: ScopeIndex) {
			this.scope = scope;
		}

		public setScopeOwner(plr: Player) {
			this.scopeOwner = plr;
		}

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
				return true;
			}
		}
	}
}
