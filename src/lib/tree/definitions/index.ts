import { StateTreeDefinition } from "../../global/Types";
import { RestrictedScope, ScopeIndex } from "../nodes/RestrictedScope";
import { IndexableNode, StateNode } from "../nodes/StateNode";
import { Replication } from "../replication";
import { Network } from "../replication/Network";

export type BuiltDefinitions = {};

export class Definition<T extends StateTreeDefinition> {
	private internalDefinitions: T;

	public constructor(definitions: T, private readonly network: Network) {
		this.internalDefinitions = definitions;
	}

	public GetRoot<K extends keyof T>(key: K): T[K] {
		return this.internalDefinitions[key as K];
	}
}

export class DefinitionBuilder {
	public static definitionTraversal(
		parent: StateNode,
		definition: StateTreeDefinition,
		currentScope: ScopeIndex,
		replicatableNodes: StateNode[],
	) {
		for (let [_, v] of pairs(definition)) {
			if (v instanceof RestrictedScope) {
				currentScope = v.getScope();
			}

			v.setParent(parent);

			if (Replication.isReplicatableScope(currentScope)) {
				replicatableNodes.push(v);
			}

			if (v instanceof IndexableNode) {
				DefinitionBuilder.definitionTraversal(
					v,
					v.paths,
					currentScope,
					replicatableNodes,
				);
			} else {
				v.GetReplicator().setScope(currentScope);
			}
		}
	}

	public static build<T extends StateTreeDefinition>(
		definition: T,
		networkName: string,
	): Definition<T> {
		let replicatableNodes: StateNode[] = [];
		for (let [i, v] of pairs(definition)) {
			if (v instanceof RestrictedScope) {
				DefinitionBuilder.definitionTraversal(
					v,
					v.paths,
					v.getScope(),
					replicatableNodes,
				);
			} else {
				warn(
					`[ROAST] DefinitionBuilder: ${i} is not a RestrictedScope/Scope object.`,
				);
			}
		}
		let created = new Definition(
			definition,
			new Network(networkName, replicatableNodes),
		);
		return created;
	}
}
