import { DefaultMode, ReplicationMode } from "./lib/global/Enums";
import { StateNode } from "./lib/tree";
import { Definition, DefinitionBuilder } from "./lib/tree/definitions";

/**
 * ENUM Collection.
 */
export { DefaultMode, ReplicationMode };

export namespace ROAST {
	/** @hidden */
	export const ROAST_VERSION = "0.0.1";
	const NETWORK_NAME = "ROAST_NETWORK";

	export enum ROAST_STATUS {
		ACTIVE,
	}

	export function CreateDefinitions<T extends Record<string, StateNode>>(
		definitions: T,
	): Definition<T> {
		return DefinitionBuilder.build(definitions, NETWORK_NAME);
	}
}
