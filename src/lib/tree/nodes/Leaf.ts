import { Replication } from "../replication";
import { Middleware } from "../replication/Middleware";
import { NetworkActor } from "../replication/Packet";
import { StateNode } from "./StateNode";

export class LeafNode<T> extends StateNode {
	private middleware: Middleware<T>[] = [];

	constructor(private value: T | undefined) {
		super();
	}

	public get(): Promise<T> {
		return new Promise((res, rej) => {});
	}

	/**
	 * @hidden Hidden for now.
	 */
	public getPrivateValue(): T | undefined {
		return this.value;
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

	/**
	 * Adds new Middleware to the leaf node
	 * @param middleware The middleware to add
	 * @returns The leaf node
	 */
	public setMiddleware(middleware: Middleware<T>[]): this {
		if (Replication.amOwnerActor(this.getReplicator().getScope())) {
			this.middleware.clear();
			this.middleware = middleware;
		} else {
			error("Attempt to remove middleware when lacking write permissions");
		}
		return this;
	}

	public addMiddleware(middleware: Middleware<T>): this {
		if (Replication.amOwnerActor(this.getReplicator().getScope())) {
			this.middleware.clear();
			this.middleware.push(middleware);
		} else {
			error("Attempt to remove middleware when lacking write permissions");
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
		if (Replication.amOwnerActor(this.getReplicator().getScope())) {
			for (const middleware of this.middleware) {
				try {
					if (!middleware.check(oldValue, newValue)) {
						return middleware;
					}
				} catch (e) {
					warn(
						`ROAST - Middleware "${middleware.name}" failed to run for node "${this.name}".`,
					);
				}
			}
		}
		return;
	}

	public subscribe(): this {
		return this;
	}
}
