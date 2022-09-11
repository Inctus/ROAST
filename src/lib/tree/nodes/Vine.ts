import { Nodes } from ".";
import { StateTreeDefinition } from "../../global/Types";
import { StateNode } from "./StateNode";
import { BranchNode } from "./Branch";
import { ReplicatableNodeID } from "../../global/Types";

export class VineNode<
	T extends StateTreeDefinition,
	R extends unknown[],
> extends StateNode {
	private mapToID: Map<ReplicatableNodeID, BranchNode<T>> = new Map<
		ReplicatableNodeID,
		BranchNode<T>
	>();

	constructor(private template_children: (...args: R) => T) {
		super();
	}

	public add(...args: R): BranchNode<T> {
		return Nodes.Branch(this.template_children(...args));
	}

	/**
	 * **VERY IMPORTANT**:
	 *
	 * Do NOT visit parent nodes of the subtree you are subscribing to.
	 */
	public subscribe(added: (subtree: T) => void, removed: (subtree: T) => void) {}
}
