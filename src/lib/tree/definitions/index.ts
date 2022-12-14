import { StateTreeDefinition } from "../../global/Types";
import { RestrictedScope, ScopeIndex } from "../nodes/RestrictedScope";
import { IndexableNode, NodeStatus, StateNode } from "../nodes/StateNode";
import { Replication } from "../replication";
import { Network } from "../replication/Network";

export type BuiltDefinitions = {};

export class Definition<T extends StateTreeDefinition> {
	private internalDefinitions: T;

	public constructor(definitions: T, private readonly network: Network) {
		this.internalDefinitions = definitions;
	}

	public getRoot<K extends keyof T>(key: K): T[K] {
		return this.internalDefinitions[key as K];
	}
}

export class DefinitionBuilder {
	public static definitionTraversal(
		parent: StateNode,
		definition: StateTreeDefinition,
		currentScope: ScopeIndex,
		replicatableNodes: StateNode[],
	): string {
		let lastName: string = "";
		for (let [name, node] of pairs(definition)) {
			if (node instanceof RestrictedScope) {
				currentScope = node.getScope();
			}

			node.name = name;
			node.parent = parent;

			if (Replication.amOwnerActor(currentScope)) {
				node.setState(NodeStatus.CONSISTENT);
			}

			if (Replication.replicates(currentScope)) {
				replicatableNodes.push(node);
			}

			if (node instanceof IndexableNode) {
				DefinitionBuilder.definitionTraversal(
					node,
					node.getSubstates(),
					currentScope,
					replicatableNodes,
				);
			}

			lastName = name;
		}
		return lastName;
	}

	public static build<T extends StateTreeDefinition>(
		definition: T,
		networkName: string,
	): Definition<T> {
		let replicatableNodes: StateNode[] = [];
		let lastName: string = "";
		for (let [name, node] of pairs(definition as StateTreeDefinition)) {
			if (node instanceof RestrictedScope) {
				lastName = DefinitionBuilder.definitionTraversal(
					node,
					node.getSubstates(),
					node.getScope(),
					replicatableNodes,
				);
				node.name = "~/" + name;
			} else {
				warn(
					`[ROAST] DefinitionBuilder: ${name} is not a RestrictedScope/Scope object.`,
				);
			}
		}
		let created = new Definition(
			definition,
			new Network(networkName, replicatableNodes, lastName),
		);
		return created;
	}
}
