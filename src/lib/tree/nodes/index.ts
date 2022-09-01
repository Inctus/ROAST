import { StateTreeDefinition } from "../../global/Types";
import { BranchNode } from "./Branch";
import { LeafNode } from "./Leaf";
import { PublicClientScope, RestrictedScope, ScopeIndex } from "./RestrictedScope";
import { VineNode } from "./Vine";

export namespace Nodes {
	/**
	 * Creates a value container state object. You can specify the type of the value
	 * through the generic `Leaf<TYPE>` or let TypeScript infer the type.
	 */
	export function Leaf<T>(val?: T): LeafNode<T> {
		return new LeafNode<T>(val);
	}

	/**
	 * Creates a new index in the state tree. Will automatically infer and complete its
	 * children. **PLEASE DO NOT USE THE GENERIC**.
	 */
	export function Branch<T extends StateTreeDefinition>(children: T): BranchNode<T> {
		return new BranchNode<T>(children);
	}

	/**
	 * @private - Creates restricted scopes abstractly.
	 */
	function Scope<T extends StateTreeDefinition>(
		children: T,
		scope: ScopeIndex,
	): RestrictedScope<T> {
		return new RestrictedScope<T>(children).setScope(scope);
	}

	export function PublicServer<T extends StateTreeDefinition>(
		children: T,
	): RestrictedScope<T> {
		return Scope(children, ScopeIndex.PUBLIC_SERVER);
	}

	export function PrivateClient<T extends StateTreeDefinition>(
		children: T,
	): RestrictedScope<T> {
		return Scope(children, ScopeIndex.PRIVATE_CLIENT);
	}

	export function PrivateServer<T extends StateTreeDefinition>(
		children: T,
	): RestrictedScope<T> {
		return Scope(children, ScopeIndex.PRIVATE_SERVER);
	}

	export function PublicClient<T extends StateTreeDefinition>(
		children: (plr: Player) => T,
	): PublicClientScope<T> {
		return new PublicClientScope(children);
	}

	export function RestrictedPublic<T extends StateTreeDefinition>(
		children: T,
	): RestrictedScope<T> {
		return Scope(children, ScopeIndex.NEED_TO_KNOW);
	}

	export function Vine<T extends StateTreeDefinition, R extends unknown[]>(
		children: (...args: R) => T,
	): VineNode<T, R> {
		return new VineNode(children);
	}
}
