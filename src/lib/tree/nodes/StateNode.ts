import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";

// TODO: check if abstract is required.
export abstract class StateNode {
	public Parent: StateNode | undefined;
	private replicator: Replication.Replicator = new Replication.Replicator();

	constructor() {}

	/**
	 * **WARNING**: Do not use this.
	 * @hidden
	 */
	public setParent(parent: StateNode) {
		this.Parent = parent;
	}

	public getReplicator(): Replication.Replicator {
		return this.replicator!;
	}

	public setMiddleware(): this {
		return this;
	}
}

export abstract class IndexableNode<T extends StateTreeDefinition> extends StateNode {
	paths: T;

	constructor(paths: T) {
		super();

		this.paths = paths;
	}

	public get<K extends keyof T & string>(key: K): T[K] {
		return this.paths[key];
	}
}
