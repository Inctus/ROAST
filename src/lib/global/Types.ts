import { ChildCapableStateNode, StateNode } from "../tree/StateNode";

export type StateTreeDefinition = Record<string, ChildCapableStateNode | StateNode>;
