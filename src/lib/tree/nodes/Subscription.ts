export type SubscriptionRejected<T> = (e: string) => T;
export type SubscriptionCallback<T, S> = (v: T) => S;

enum subState {
	THEN,
	CATCH,
	FAILED,
}

export class NodeSubscription<T> {
	protected handlers: Array<[subState, SubscriptionCallback<T, unknown>]> = new Array();
	private returnsStack: never[] = [];

	private errMsg = "";
	private failed = false;

	public fire(v: T): void {
		const handlers = this.handlers;

		for (let index = 0; index < handlers.size(); index++) {
			const [typeOfHandler, handler] = handlers[index];

			switch (typeOfHandler) {
				case subState.THEN:
					if (!this.failed) {
						try {
							const lastReturn = this.returnsStack[0];
							const arg = lastReturn !== undefined ? lastReturn : v;

							this.returnsStack.pop();
							this.returnsStack.push(handler(arg) as never);
						} catch (e) {
							this.errMsg = e as string;
							this.failed = true;
						}
					}

					continue;
				case subState.CATCH:
					if (this.failed && this.errMsg) {
						this.returnsStack.pop();
						this.returnsStack.push(handler(this.errMsg as unknown as T) as never);

						this.errMsg = "";
						this.failed = false;
					}

					continue;
			}
		}
	}

	public then<X>(v: SubscriptionCallback<T, X>): NodeSubscription<X> {
		this.handlers.push([subState.THEN, v]);

		return this as unknown as NodeSubscription<X>;
	}

	public catch<X>(v: SubscriptionRejected<X>): NodeSubscription<X> {
		this.handlers.push([subState.CATCH, v as unknown as SubscriptionCallback<T, X>]);

		return this as unknown as NodeSubscription<X>;
	}
}

export class NodeSubscriptionBuilder {
	public static build<T>(): NodeSubscription<T> {
		return new NodeSubscription<T>();
	}
}
