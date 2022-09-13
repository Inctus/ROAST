import { StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";
import { Packet } from "../replication/Packet";
import { IndexableNode, NodeStatus } from "./StateNode";

export class BranchNode<T extends StateTreeDefinition> extends IndexableNode<T> {
	// private readonly subscriptions: NodeSubscription<T>[] = [];

	constructor(children: T) {
		super(children);
	}

	public subscribe(): this {
		assert(Replication.canRead(this.replicator.getScope()));
		if (this.state === NodeStatus.INCONSISTENT) {
			this.state = NodeStatus.SUBSCRIBING;
			this.replicator.enqueuePacket(Packet.Subscribe());
			return this;
		}
		// ADD SUBSCRIPTION TO LIST OF SUBSCRIPTIONS
		return this;
	}
}
