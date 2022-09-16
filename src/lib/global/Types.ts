import { StateNode } from "../tree/nodes/StateNode";

export type StateTreeDefinition = Record<string, StateNode>;
export type ImmutableStateTreeDefinition = Record<string, ImmutableStateNode>;

export interface ImmutableStateNode {
	readonly name: string;
}
export interface ImmutableIndexableNode<T extends StateTreeDefinition>
	extends ImmutableStateNode {
	get<K extends keyof T>(key: K): ReturnType<T[K]["generateSnapshot"]>;
}
export interface ImmutableLeafNode<V> extends ImmutableStateNode {
	get(): V | undefined;
	set(newValue: V): void;
}

export type Subscription<N extends StateNode> = (
	snapshot: ReturnType<N["generateSnapshot"]>,
) => any;
