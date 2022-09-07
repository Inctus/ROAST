import { Players } from "@rbxts/services";
import { Nodes } from ".";
import { StateTreeDefinition } from "../../global/Types";
import { StateNode } from "./StateNode";
import { BranchNode } from "./Branch";
import { NodeID } from "../../global/Types";

export class VineNode<
	T extends StateTreeDefinition,
	R extends unknown[],
> extends StateNode {
	private template_children: (...args: R) => T;
	private mapToID: Map<NodeID, BranchNode<T>> = new Map<NodeID, BranchNode<T>>();

	constructor(value: (...args: R) => T) {
		super();

		this.template_children = value;
	}

	/** @deprecated */
	public Get(str: NodeID): BranchNode<T> {
		return this.mapToID.get(str) as BranchNode<T>;
	}

	public Add(...args: R): BranchNode<T> {
		return Nodes.Branch(this.template_children(...args));
	}

	/**
	 * **VERY IMPORTANT**:
	 *
	 * Do NOT visit parent nodes of the subtree you are subscribing to.
	 */
	public Subscribe(added: (subtree: T) => void, removed: (subtree: T) => void) {}
}
