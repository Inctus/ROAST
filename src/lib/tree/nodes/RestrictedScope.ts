import { Players } from "@rbxts/services";
import { Nodes } from ".";
import { StateTreeDefinition } from "../../global/Types";
import { IndexableNode, StateNode } from "./StateNode";
import { BranchNode } from "./Branch";

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
	 * Not yet assigned
	 */
	UNASSIGNED,
}

export class RestrictedScope<T extends StateTreeDefinition> extends IndexableNode<T> {
	constructor(
		children: T,
		private readonly scope: Exclude<
			ScopeIndex,
			ScopeIndex.PUBLIC_CLIENT | ScopeIndex.UNASSIGNED
		>,
	) {
		super(children);
	}

	getScope() {
		return this.scope;
	}
}

export class PublicClientScope<T extends StateTreeDefinition> extends StateNode {
	private mapToPlayers: Map<string, BranchNode<T>> = new Map<string, BranchNode<T>>();

	constructor(private readonly templateChildren: (plr: Player) => T) {
		super();

		Players.PlayerAdded.Connect((plr) => {
			this.mapToPlayers.set(
				tostring(plr.UserId),
				Nodes.Branch(this.templateChildren(plr)),
			);
		});

		// REMOVE PLAYER WHEN THEY LEAVE AS WELL
	}

	public getPlayer(plr: Player): BranchNode<T> {
		return this.mapToPlayers.get(tostring(plr.UserId)) as BranchNode<T>;
	}
}
