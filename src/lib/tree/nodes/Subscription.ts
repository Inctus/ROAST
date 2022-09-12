import { LeafNode } from "./Leaf";

interface Receiver<T> {
	then<X>(v: (val: T) => X): Receiver<X>;

	catch<X>(v: (err: string) => X): Receiver<X>;
}

export type SubscriptionRejected = (reason: string) => void;
export type SubscriptionResolved = (e: any) => void;
export type NodeSubscriptionFunction<T> = (val: T) => void;

enum subtype {
	THEN,
	CATCH,
	FAILED,
}

export type KeyedHandler<T> = [subtype, T];

export class NodeSubscription<V, T extends LeafNode<V>> {
	handlers: KeyedHandler<NodeSubscriptionFunction<V>>[] = [];

	/** @hidden */
	public fire() {}

	public then<X>(v: (val: V) => X): Receiver<X> {
		this.handlers.push([subtype.THEN, v]);
		return this as unknown as Receiver<X>;
	}

	public catch<X>(v: (err: string) => X): Receiver<X> {
		return this as unknown as Receiver<X>;
	}
}

export class NodeSubscriptionBuilder {
	public static build<V>() {
		return new NodeSubscription<V, LeafNode<V>>();
	}
}

// .Subscribe([ROAST.SanityCheck.Position])
// .then((val: LeafNode<number>) => {
// 	let
// })
// .catch(() => {})
// .then()
// .then();
