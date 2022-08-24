import { StateNode } from "./StateNode";

export class LeafNode<T> extends StateNode {
	private value: T | undefined;

	constructor(value: T | undefined) {
		super();
		this.value = value;
	}

	public GetValue(): Promise<T> {
		return new Promise((res, rej) => {});
	}
}
