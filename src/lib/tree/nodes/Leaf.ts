import { ImmutableLeafNode, ImmutableStateNode } from "../../global/Types";
import { Replication } from "../replication";
import { Middleware } from "../replication/Middleware";
import { NetworkActor, Packet } from "../replication/Packet";
import { NodeStatus, StateNode } from "./StateNode";
import { NodeSubscription } from "./Subscription";

export class LeafNode<T> extends StateNode {
	private middleware: Middleware<T>[] = [];
	private readonly unresolvedGets: ((value: T) => void)[] = [];
	// private readonly subscriptions: NodeSubscription<T>[] = [];

	constructor(private value: T | undefined) {
		super();
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

	public get(): Promise<T> {
		assert(Replication.canRead(this.replicator.getScope()));
		return new Promise((resolve) => {
			switch (this.state) {
				case NodeStatus.INCONSISTENT:
					this.subscribe();
				case NodeStatus.SUBSCRIBING:
					this.unresolvedGets.push(resolve);
					break;
				case NodeStatus.CONSISTENT: {
					if (this.value !== undefined) {
						resolve(this.value);
					} else {
						this.unresolvedGets.push(resolve);
					}
				}
			}
		});
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
		assert(Replication.actorCanWrite(source, this.replicator.getScope()));
		// TODO -> fire local subscriptions
		this.value = newValue;
		// Propagate change upwards
		this.parent?.childChanged();
		// If I'm of a replicable scope, then replicate the update
		if (Replication.replicates(this.replicator.getScope())) {
			this.replicator.replicateUpdateFrom(newValue, source);
		}
		return this;
	}

	/**
	 * Adds new Middleware to the leaf node
	 * @param middleware The middleware to add
	 * @returns The leaf node
	 */
	public setMiddleware(middleware: Middleware<T>[]): this {
		if (Replication.amOwnerActor(this.replicator.getScope())) {
			this.middleware.clear();
			this.middleware = middleware;
		} else {
			error("Attempt to set middleware when lacking write permissions");
		}
		return this;
	}

	public addMiddleware(middleware: Middleware<T>): this {
		if (Replication.amOwnerActor(this.replicator.getScope())) {
			this.middleware.push(middleware);
		} else {
			error("Attempt to add middleware when lacking write permissions");
		}
		return this;
	}

	/**
	 * Runs the middleware for this node
	 * @param newValue The new value to check
	 * @returns The failing middleware, if any
	 * @hidden
	 */
	public runMiddleware(oldValue: T, newValue: T): Middleware<T> | undefined {
		if (Replication.amOwnerActor(this.replicator.getScope())) {
			for (const middleware of this.middleware) {
				try {
					if (!middleware.check(oldValue, newValue)) {
						return middleware;
					}
				} catch (e) {
					warn(
						`ROAST - Middleware "${
							middleware.name
						}" failed to run for Node "${this.getFullName()}".`,
					);
				}
			}
		}
		return;
	}

	public generateSnapshot(): ImmutableLeafNode<T> {
		let cache: T | undefined = this.value;
		return {
			name: this.name!,
			get: () => cache,
		};
	}
}
