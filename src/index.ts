import { ContextActionService } from "@rbxts/services";
import { DefaultMode, ReplicationMode } from "./lib/global/Enums";
import { StateNode } from "./lib/tree";
import { Definition, DefinitionBuilder } from "./lib/tree/definitions";
import { Network } from "./lib/tree/replication/Network";

/**
 * ENUM Collection.
 */
export { DefaultMode, ReplicationMode };

export namespace ROAST {
	/** @hidden */
	export const ROAST_VERSION = "0.0.1";

	export enum ROAST_STATUS {
		ACTIVE,
	}

	export function CreateDefinitions<T extends Record<string, StateNode>>(
		definitions: T,
	): Definition<T> {
		let tree = DefinitionBuilder.build(definitions);
		new Network("ROAST", tree);
		return tree;
	}
}
