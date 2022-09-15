import { BranchNode } from "../tree/nodes/Branch";
import { LeafNode } from "../tree/nodes/Leaf";
import { StateNode } from "../tree/nodes/StateNode";

let tree: StateTreeDefinition = {
	Hi: new LeafNode("Hi"),
};

interface directValue<T> {
	get(): T;
}

export type ImmStateNode = StateNode;
export type ImmLeafNode<T> = Omit<LeafNode<T>, "get"> & directValue<T>;

export type StateTreeDefinition = Record<string, StateNode>;
export type ImmStateTreeDefinition = Record<string, ImmStateNode | ImmLeafNode<infer V>>;

interface ImmutableStateNode {
	name?: string;
	value: unknown;
}

let vTree: ImmStateTreeDefinition = {
	Hi: new LeafNode("Hi"),
};

vTree.Hi.get();
