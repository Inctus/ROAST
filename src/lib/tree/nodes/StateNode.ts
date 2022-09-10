import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";
import { ScopeIndex } from "./RestrictedScope";

// TODO: check if abstract is required.
export class StateNode {
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

	public GetReplicator(): Replication.Replicator {
		return this.replicator!;
	}

	public SetMiddleware(): this {
		return this;
	}
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
