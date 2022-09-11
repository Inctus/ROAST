import { Replication } from "../replication";
import { NetworkActor } from "../replication/Packet";
import { StateNode } from "./StateNode";

export class LeafNode<T> extends StateNode {
	constructor(private value: T | undefined) {
		super();
	}

	public getValue(): Promise<T> {
		return new Promise((res, rej) => {});
	}

	/**
	 * Sets a new value for the leaf node
	 * @precondition If the change comes from the Network, node middleware has been ran
	 * @postcondition The change will be distributed to all observers
	 *
	 * @param newValue The new value to set
	 * @hidden @param source The NetworkActor source of the change
	 * @returns
	 */
	public setValue(newValue: T, source: NetworkActor = Replication.getActor()): this {
		// TODO -> fire local subscriptions

		this.value = newValue;
		// Propagate change upwards
		this.Parent?.childChanged();
		// Propagate change to subscribed NetworkActors excluding the source
		this.getReplicator().distributeUpdate(newValue, source);
		return this;
	}

	public subscribe(): this {
		return this;
	}
}
