import { ImmutableIndexableNode, StateTreeDefinition } from "../../global/Types";
import { Replication } from "../replication";
import { Packet } from "../replication/Packet";
import { IndexableNode, NodeStatus } from "./StateNode";

export class BranchNode<T extends StateTreeDefinition> extends IndexableNode<T> {
	private readonly subscriptions: ((snapshot: ImmutableIndexableNode<T>) => any)[] = [];

	constructor(children: T) {
		super(children);
	}

	public subscribe(subscription: (snapshot: ImmutableIndexableNode<T>) => any): this {
		assert(Replication.canRead(this.replicator.getScope()));
		if (this.state === NodeStatus.INCONSISTENT) {
			this.state = NodeStatus.SUBSCRIBING;
			this.replicator.enqueuePacket(Packet.Subscribe());
		}
		this.subscriptions.push(subscription);
		return this;
	}

	public override fire() {
		const snapshot = this.generateSnapshot();
		for (const subscription of this.subscriptions) {
			subscription(snapshot);
		}
		super.fire();
	}
}
