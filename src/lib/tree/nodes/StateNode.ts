import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";

export abstract class StateNode {
	public Parent: StateNode | null = null;

	constructor() {}

	/**
	 * **WARNING**: Do not use this.
	 */
	public setParent(parent: StateNode) {
		this.Parent = parent;
	}

	private replicator = new Replication.ReplicationOptions(this);
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

export abstract class ValueCapableStateNode extends StateNode {}
