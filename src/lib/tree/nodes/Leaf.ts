import { Replication } from "../replication";
import { NetworkActor } from "../replication/Packet";
import { StateNode } from "./StateNode";

export class LeafNode<T> extends StateNode {
	constructor(private value: T | undefined) {
		super();
	}

	public get(): Promise<T> {
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
	public set(newValue: T, source: NetworkActor = Replication.getActor()): this {
		if (Replication.isWritableActor(source, this.getReplicator().getScope())) {
			// TODO -> fire local subscriptions
			this.value = newValue;
			// Propagate change upwards
			this.Parent?.childChanged();
			// If I'm of a replicable scope, then replicate the update
			if (Replication.replicates(this.getReplicator().getScope())) {
				this.getReplicator().replicateUpdateFrom(newValue, source);
			}
		} else {
			error("Attempt to set value when lacking write permissions");
		}
		return this;
	}

	public subscribe(): this {
		return this;
	}
}
