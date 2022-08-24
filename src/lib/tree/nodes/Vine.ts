import { Players } from "@rbxts/services";
import { Nodes } from ".";
import { StateTreeDefinition } from "../../global/Types";
import { StateNode } from "./StateNode";
import { BranchNode } from "./Branch";
import { GUID } from "../replication/net";

export class VineNode<T extends StateTreeDefinition, R extends unknown[]> extends StateNode {
	private template_children: (...args: R) => T;
	private mapToID: Map<string, BranchNode<T>> = new Map<string, BranchNode<T>>();

	constructor(value: (...args: R) => T) {
		super();

		this.template_children = value;
	}

	/** @deprecated */
	public Get(str: GUID): BranchNode<T> {
		return this.mapToID.get(str) as BranchNode<T>;
	}

	public Add(...args: R): BranchNode<T> {
		return Nodes.Branch(this.template_children(...args));
	}

	public Subscribe() {}
}
