import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";
import { Middleware } from "../replication/Middleware";
import { LeafNode } from "./Leaf";

// TODO: check if abstract is required.
export abstract class StateNode {
	private readonly replicator: Replication.Replicator<this> =
		new Replication.Replicator(this);
	public Parent: StateNode | undefined;
	public name?: string;

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

	public childChanged() {
		this.Parent?.childChanged();
	}
}

export abstract class IndexableNode<T extends StateTreeDefinition> extends StateNode {
	constructor(private readonly substates: T) {
		super();

		this.substates = substates;
	}

	public get<K extends keyof T & string>(key: K): T[K] {
		return this.substates[key];
	}

	public getSubstates(): T {
		return this.substates;
	}

	/**
	 * Adds new Middleware recursively to all leaf nodes beneath this node
	 * @param middleware The middleware to add
	 */
	public setMiddleware<T>(middleware: Middleware<T>[]): this {
		if (Replication.amOwnerActor(this.getReplicator().getScope())) {
			for (const [_, substate] of pairs(this.substates)) {
				if (substate instanceof LeafNode<T> || substate instanceof IndexableNode) {
					substate.setMiddleware(middleware);
				}
			}
		} else {
			error("Attempt to remove middleware when lacking write permissions");
		}
		return this;
	}

	public addMiddleware<T>(middleware: Middleware<T>): this {
		if (Replication.amOwnerActor(this.getReplicator().getScope())) {
			for (const [_, substate] of pairs(this.substates)) {
				if (substate instanceof LeafNode<T> || substate instanceof IndexableNode) {
					substate.addMiddleware(middleware);
				}
			}
		} else {
			error("Attempt to remove middleware when lacking write permissions");
		}
		return this;
	}
}
