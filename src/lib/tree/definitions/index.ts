import { StateTreeDefinition } from "../../global/Types";
import { RestrictedScope, ScopeIndex } from "../nodes/RestrictedScope";
import { IndexableNode, StateNode } from "../nodes/StateNode";

export type BuiltDefinitions = {};

export class Definition<T extends StateTreeDefinition> {
	private internalDefinitions: T;
	//private baseReplicatableNodes: StateNode[];

	public constructor(definitions: T) {
		this.internalDefinitions = definitions;
	}

	public GetRoot<K extends keyof T>(key: K): T[K] {
		return this.internalDefinitions[key as K];
	}

	public GetReplicatableNodes(): StateNode[] {
		//AUGUMENT THE BASE REPLICATABLE NODES WITH THE NODES FROM
		//BERRIES ON VINES
		return [];
	}
}

export class DefinitionBuilder {
	public static definitionTraversal(
		parent: StateNode,
		definition: StateTreeDefinition,
		currentScope: ScopeIndex,
	) {
		for (let [i, v] of pairs(definition)) {
			if (v instanceof RestrictedScope) {
				currentScope = v.getScope();
			}

			v.setParent(parent);

			if (v instanceof IndexableNode) {
				DefinitionBuilder.definitionTraversal(v, v.paths, currentScope);
			} else {
				v.GetReplicator().setScope(currentScope);
			}
		}
	}

	public static build<T extends StateTreeDefinition>(definition: T): Definition<T> {
		for (let [i, v] of pairs(definition)) {
			if (v instanceof RestrictedScope) {
				DefinitionBuilder.definitionTraversal(v, v.paths, v.getScope());
			} else {
				warn(
					`[ROAST] DefinitionBuilder: ${i} is not a RestrictedScope/Scope object.`,
				);
			}
		}
		return new Definition(definition);
	}
}
