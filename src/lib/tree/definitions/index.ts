import { StateTreeDefinition } from "../../global/Types";
import { Nodes } from "../nodes";
import { BranchNode } from "../nodes/Branch";
import { RestrictedScope, ScopeIndex } from "../nodes/RestrictedScope";
import { IndexableNode, StateNode } from "../nodes/StateNode";

export type BuiltDefinitions = {};

export class Definition<T extends StateTreeDefinition> {
	private internal_definitions: T;
	public constructor(definitions: T) {
		this.internal_definitions = definitions;
	}

	public GetRoot<K extends keyof T>(key: K): T[K] {
		return this.internal_definitions[key as K];
	}
}

export class DefinitionBuilder {
	public static definitionTraversal(parent: StateNode, definition: StateTreeDefinition, currentScope: ScopeIndex) {
		for (let [i, v] of pairs(definition)) {
			v.setParent(parent);

			if (v instanceof IndexableNode) {
				DefinitionBuilder.definitionTraversal(v, v.paths, currentScope);
			} else {
			}
		}
	}

	public static build<T extends StateTreeDefinition>(definition: T): Definition<T> {
		for (let [i, v] of pairs(definition)) {
			if (v instanceof RestrictedScope) {
				DefinitionBuilder.definitionTraversal(v, v.paths, v.getScope());
			} else {
				warn(`[ROAST] DefinitionBuilder: ${i} is not a RestrictedScope/Scope object.`);
			}
		}
		return new Definition(definition);
	}
}
