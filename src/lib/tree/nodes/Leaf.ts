import { StateNode } from "../StateNode";

export class Leaf<T> extends StateNode {
	private value: T;

	constructor(value: T) {
		super();
		this.value = value;
	}
}
