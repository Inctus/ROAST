import { StateNode } from "../tree/nodes/StateNode";

export type NodeID = number;
export type StateTreeDefinition = Record<NodeID, StateNode>;
