import { StateTreeDefinition } from "../global/Types";

export abstract class StateNode {
	public Parent: StateNode | null = null;

	constructor() {}

	public setParent(parent: StateNode) {
		this.Parent = parent;
	}
}

export abstract class ChildCapableStateNode extends StateNode {
	public Children: StateTreeDefinition;

	constructor(children: StateTreeDefinition = {}) {
		super();

		this.Children = children;
	}

	public Get(key: string) {
		return this.Children[key];
	}

	public computeChildren() {}
}

export abstract class IndexableNode<T extends StateTreeDefinition> extends StateNode {
	paths: T;
	public constructor(paths: T) {
		super();

		this.paths = paths;
	}
	public Get<K extends keyof T & string>(key: K): T[K] {
		return this.paths[key];
	}
}

class Branch<T extends StateTreeDefinition> extends IndexableNode<T> {
	constructor(paths: T) {
		super(paths);
		this.paths = paths;
	}
}

export abstract class ValueCapableStateNode extends StateNode {}
