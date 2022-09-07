import { StateNode } from "../tree/nodes/StateNode";

export type NodeID = string;
export type StateTreeDefinition = Record<NodeID, StateNode>;
