export type SubscriptionRejected<T> = (e: string) => T;
export type SubscriptionCallback<T, S> = (v: T) => S;

enum subState {
	THEN,
	CATCH,
	FAILED,
}

export class NodeSubscription<T> {
	protected handlers: Array<[subState, SubscriptionCallback<T, unknown>]> = new Array();

	public fire(value: T): void {
		let errorMessage = "";
		let failed = false;
		let returnFrom: unknown;

		for (const [typeOfHandler, handler] of this.handlers) {
			switch (typeOfHandler) {
				case subState.THEN:
					if (!failed) {
						try {
							returnFrom = handler((returnFrom !== undefined ? returnFrom : value) as T);
						} catch (e) {
							errorMessage = e as string;
							failed = true;
						}
					}

					continue;
				case subState.CATCH:
					if (failed && errorMessage !== "") {
						returnFrom = handler(errorMessage as unknown as T);

						errorMessage = "";
						failed = false;
					}

					continue;
			}
		}
	}

	public then<X>(value: SubscriptionCallback<T, X>): NodeSubscription<X> {
		this.handlers.push([subState.THEN, value]);

		return this as unknown as NodeSubscription<X>;
	}

	public catch<X>(value: SubscriptionRejected<X>): NodeSubscription<X> {
		this.handlers.push([subState.CATCH, value as unknown as SubscriptionCallback<T, X>]);

		return this as unknown as NodeSubscription<X>;
	}
}

export class NodeSubscriptionBuilder {
	public static build<T>(): NodeSubscription<T> {
		return new NodeSubscription<T>();
	}
}
