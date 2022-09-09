import { NodeID, StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";

// TODO: check if abstract is required.
export class StateNode {
	public Parent: StateNode | undefined = undefined;
	private ID: NodeID | undefined = undefined;

	constructor() {}

	/**
	 * **WARNING**: Do not use this.
	 * @hidden
	 */
	public setParent(parent: StateNode) {
		this.Parent = parent;
	}

	private replicator = new Replication.ReplicationOptions(this);

	public GetID() {
		return this.ID;
	}

	public SetID(id: NodeID) {
		this.ID = id;
	}

	public GetReplicator() {
		return this.replicator;
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
