import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";
import { Middleware } from "../replication/Middleware";
import { LeafNode } from "./Leaf";

export enum NodeStatus {
	INCONSISTENT,
	CONSISTENT,
	SUBSCRIBING
}

// TODO: check if abstract is required.
export abstract class StateNode {
	protected readonly replicator: Replication.Replicator<this> =
		new Replication.Replicator(this);
	protected state: NodeStatus = NodeStatus.INCONSISTENT;
	/** @hidden */
	public parent?: StateNode;
	public name?: string;

	constructor() {}

	public setState(state: NodeStatus) {
		this.state = state;
	}

	public getReplicator(): Replication.Replicator<this> {
		return this.replicator;
	}

	public childChanged() {
		this.parent?.childChanged();
	}

	public getFullName(): string {
		return this.parent?.getFullName() + "/" + this.name;
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
		if (Replication.amOwnerActor(this.replicator.getScope())) {
			for (const [_, substate] of pairs(this.substates)) {
				if (substate instanceof LeafNode<T> || substate instanceof IndexableNode) {
					substate.setMiddleware(middleware);
				}
			}
		} else {
			error("Attempt to set middleware when lacking write permissions");
		}
		return this;
	}

	public addMiddleware<T>(middleware: Middleware<T>): this {
		if (Replication.amOwnerActor(this.replicator.getScope())) {
			for (const [_, substate] of pairs(this.substates)) {
				if (substate instanceof LeafNode<T> || substate instanceof IndexableNode) {
					substate.addMiddleware(middleware);
				}
			}
		} else {
			error("Attempt to add middleware when lacking write permissions");
		}
		return this;
	}
}
