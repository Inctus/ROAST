import { LeafNode } from "../nodes/Leaf";

export class Middleware<T> {
	public readonly name = "";

	public constructor(name: string, handler: (node: LeafNode<T>) => void) {}
}
