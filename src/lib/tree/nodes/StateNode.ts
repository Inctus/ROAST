import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";

// TODO: check if abstract is required.
export abstract class StateNode {
	private readonly replicator: Replication.Replicator<this> =
		new Replication.Replicator(this);
	public Parent: StateNode | undefined;

	constructor() {}

	/**
	 * **WARNING**: Do not use this.
	 * @hidden
	 */
	public setParent(parent: StateNode) {
		this.Parent = parent;
	}

	public getReplicator(): Replication.Replicator<this> {
		return this.replicator;
	}

	public setMiddleware(): this {
		return this;
	}

	public childChanged() {
		this.Parent?.childChanged();
	}
}

export abstract class IndexableNode<T extends StateTreeDefinition> extends StateNode {
	constructor(private readonly paths: T) {
		super();

		this.paths = paths;
	}

	public get<K extends keyof T & string>(key: K): T[K] {
		return this.paths[key];
	}

	public getSubstates(): T {
		return this.paths;
	}
}
