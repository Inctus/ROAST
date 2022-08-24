import { StateTreeDefinition } from "../../global/Types";
import { IndexableNode } from "./StateNode";

export class BranchNode<T extends StateTreeDefinition> extends IndexableNode<T> {
	constructor(children: T) {
		super(children);
	}

	observe(resolver: (tree: BranchNode<T>) => void) {}
}
