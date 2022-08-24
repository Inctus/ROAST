import { Players } from "@rbxts/services";
import { Nodes } from ".";
import { StateTreeDefinition } from "../../global/Types";
import { IndexableNode, StateNode } from "./StateNode";
import { BranchNode } from "./Branch";
import { VineNode } from "./Vine";

export enum ScopeIndex {
	/**
	 * `ScopeIndex.PUBLIC_SERVER` denotes that this is a state subtree editable by the server,
	 * where **all changes** replicate to all clients by default.
	 */
	PUBLIC_SERVER,
	/**
	 * `ScopeIndex.PRIVATE_CLIENT` denotes that this is a state subtree editable by the client,
	 * and only available to the client.
	 */
	PRIVATE_CLIENT,
	/**
	 * `ScopeIndex.PRIVATE_SERVER` denotes that this is a state subtree editable by the server,
	 * and only available to the server.
	 */
	PRIVATE_SERVER,
	/**
	 * `ScopeIndex.PUBLIC_CLIENT` denotes that this is a Vine that presents a mutually editable
	 * subtree both to the client and the server, with the server having write authority. All
	 * clients are able to view this tree.
	 */
	PUBLIC_CLIENT,
	/**
	 * `ScopeIndex.NEED_TO_KNOW` denotes that this is a state subtree where the client does
	 * not have any awareness of the existing keys.
	 */
	NEED_TO_KNOW,
}

export class RestrictedScope<T extends StateTreeDefinition> extends IndexableNode<T> {
	private Scope: ScopeIndex = ScopeIndex.PUBLIC_SERVER;

	constructor(children: T) {
		super(children);
	}

	setScope(scope: ScopeIndex) {
		if (scope === ScopeIndex.PUBLIC_CLIENT) warn(`Please do not use ScopeIndex.PUBLIC_CLIENT`);
		this.Scope = scope;
		return this;
	}

	getScope() {
		return this.Scope;
	}
}

export class PublicClientScope<T extends StateTreeDefinition> extends StateNode {
	private template_children: (plr: Player) => T;
	private mapToPlayers: Map<string, BranchNode<T>> = new Map<string, BranchNode<T>>();

	constructor(value: (plr: Player) => T) {
		super();

		this.template_children = value;

		Players.PlayerAdded.Connect((plr) => {
			this.mapToPlayers.set(tostring(plr.UserId), Nodes.Branch(this.template_children(plr)));
		});
	}

	public GetPlayer(plr: Player): BranchNode<T> {
		return this.mapToPlayers.get(tostring(plr.UserId)) as BranchNode<T>;
	}
}
