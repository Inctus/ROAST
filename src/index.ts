import { DefaultMode, ReplicationMode } from "./lib/global/Enums";
import { StateTreeDefinition } from "./lib/global/Types";
import { StateNode } from "./lib/tree";
import { Definition, DefinitionBuilder } from "./lib/tree/definitions";

/**
 * ENUM Collection.
 */
export { DefaultMode, ReplicationMode };
export {};

export namespace ROAST {
	/** @hidden */
	export const ROAST_VERSION = "0.0.1";

	export enum ROAST_CONTEXT {
		ACTIVE,
	}

	export function CreateDefinitions<T extends Record<string, StateNode>>(
		definitions: T,
		context: ROAST_CONTEXT = ROAST_CONTEXT.ACTIVE,
	): Definition<T> {
		return DefinitionBuilder.build(definitions);
	}
}
