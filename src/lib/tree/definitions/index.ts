import { StateTreeDefinition } from "../../global/Types";
import { RestrictedScope, ScopeIndex } from "../nodes/RestrictedScope";
import { IndexableNode, StateNode } from "../nodes/StateNode";
import { VineNode } from "../nodes/Vine";

export type BuiltDefinitions = {};

export class Definition<T extends StateTreeDefinition> {
	private internalDefinitions: T;

	public constructor(definitions: T, private baseReplicatableNodes: StateNode[]) {
		this.internalDefinitions = definitions;
	}

	public GetRoot<K extends keyof T>(key: K): T[K] {
		return this.internalDefinitions[key as K];
	}

	public GetReplicatableNodes(): StateNode[] {
		let nodes: StateNode[] = [];
		nodes.push(...this.baseReplicatableNodes);
		//AUGUMENT THE BASE REPLICATABLE NODES WITH THE NODES FROM BERRIES ON VINES
		//SO JUST LOOP THROUGH THE BASE AND ADD ON THE VINE'S CHILDRENS
		return [];
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

			// IF NODE IS OF A REPLICATABLE SCOPE
			// PUSH IT TO THE REPLICATABLE NODES

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

	public static build<T extends StateTreeDefinition>(definition: T): Definition<T> {
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
		return new Definition(definition, replicatableNodes);
	}
}
