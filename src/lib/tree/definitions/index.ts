import { StateTreeDefinition } from "../../global/Types";
import { Leaf } from "../nodes/Leaf";
import { ChildCapableStateNode, StateNode } from "../StateNode";

export type BuiltDefinitions = {};

export class Definition<T extends StateTreeDefinition> {
	private internal_definitions: T;
	public constructor(definitions: T) {
		this.internal_definitions = definitions;
	}

	public GetScope<K extends keyof T>(key: K): T[K] {
		return this.internal_definitions[key as K];
	}
}

export class DefinitionBuilder {
	public static build<T extends StateTreeDefinition>(definition: T): Definition<T> {
		return new Definition(definition);
	}
}
