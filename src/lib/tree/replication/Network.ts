import { ReplicatedStorage, RunService } from "@rbxts/services";
import { Replication } from ".";
import { StateTreeDefinition } from "../../global/Types";
import { BranchNode } from "../nodes/Branch";
import { LeafNode } from "../nodes/Leaf";
import { StateNode } from "../nodes/StateNode";
import { VineNode } from "../nodes/Vine";
import { Middleware } from "./Middleware";
import { NetworkRequest, NetworkActor, Packet, Wrapped } from "./Packet";

export class Network {
	/**
	 * Handles the Networking of the State Tree
	 *
	 *
	 * @param remoteEventName The name of the RemoteEvent to use for networking
	 * @param tree The State Tree to network
	 * @returns A Network object that handles the networking of the State Tree
	 */
	private readonly remoteEvent;
	private readonly networkQueue: Wrapped<Packet>[] = [];
	private readonly repicatableNodes: Map<Replication.NodeID, StateNode> = new Map();
	private readonly initialBaseNodeSize: number;
	private currentNodeID: Replication.NodeID = 0;

	// Pre: Tree is built
	constructor(name: string, nodes: StateNode[], private readonly lastNodeName: string) {
		nodes.forEach((v) => this.addReplicatableNode(v));
		this.initialBaseNodeSize = nodes.size();

		if (RunService.IsServer()) {
			this.remoteEvent = new Instance("RemoteEvent");
			this.remoteEvent.Name = name;
			this.remoteEvent.Parent = ReplicatedStorage;

			this.remoteEvent.OnServerEvent.Connect((player, request) => {
				assert(request && typeOf(request) === "table");
				// TODO: Typecheck this.
				this.processNetworkRequest(request as NetworkRequest, player);
			});
		} else {
			this.remoteEvent = ReplicatedStorage.WaitForChild(name) as RemoteEvent;

			this.networkQueue.push(
				Packet.Handshake(this.initialBaseNodeSize, this.lastNodeName),
			);

			this.remoteEvent.OnClientEvent.Connect((request: NetworkRequest) => {
				this.processNetworkRequest(request, "server");
			});
		}

		RunService.Heartbeat.Connect(() => this.processNetworkTick());
	}

	private addReplicatableNode(node: StateNode) {
		this.repicatableNodes.set(this.currentNodeID, node);
		this.currentNodeID++;
	}

	private removeReplicatableNode(nodeID: Replication.NodeID) {
		this.repicatableNodes.delete(nodeID);
	}

	/**
	 * Processes and Dispatches the Network Queue
	 */
	private processNetworkTick() {
		for (const [nodeID, node] of this.repicatableNodes) {
			Packet.SignAll(node.getReplicator().getNetworkQueue(), nodeID).forEach((v) =>
				this.networkQueue.push(v),
			);
			node.getReplicator().clearNetworkQueue();
		}
		let networkRequestMap = Packet.UnwrapPackets(this.networkQueue);
		for (const [target, request] of networkRequestMap) {
			if (target === "server") {
				this.remoteEvent.FireServer(request);
			} else {
				this.remoteEvent.FireClient(target, request);
			}
		}
		this.networkQueue.clear();
	}

	private handleUpdate<T>(node: LeafNode<T>, value: T, source: NetworkActor) {
		let replicator: Replication.Replicator<LeafNode<T>> = node.getReplicator();
		let failedMiddleware: Middleware<T> | undefined = node.runMiddleware(value);
		if (!failedMiddleware) {
			node.set(value, source);
		} else {
			replicator.replicateUpdateTo(node.get(), source);
			failedMiddleware.fail();
		}
	}

	private handleSubscription<T extends StateNode, Q extends StateTreeDefinition>(
		subscriber: NetworkActor,
		node: T,
	) {
		let replicator: Replication.Replicator<T> = node.getReplicator();
		if (Replication.amOwnerActor(replicator.getScope())) {
			if (node instanceof LeafNode) {
				replicator.addSubscribedNetworkActor(subscriber);
				replicator.replicateUpdateTo(node.get(), subscriber);
			} else if (node instanceof VineNode) {
				replicator.addSubscribedNetworkActor(subscriber);
				//replicator.replicateVineTo(subscriber);
				// SEND BACK ALL VINE NODES CURRENTLY INSTANCIATED WITH
				// VINE UPDATE PACKETS
			} else if (node instanceof BranchNode<Q>) {
				for (const [_, child] of pairs(node.getSubstates() as Q)) {
					this.handleSubscription(subscriber, <StateNode>child);
				}
			} else {
				error("Attempt to subscribe to non-subscribable node");
			}
		} else {
			error("Received a subscribe packet on a non-owner context");
		}
	}

	/**
	 * Processes a NetworkRequest
	 *
	 * @param request The incoming NetworkRequest to process
	 * @param source The source of the NetworkRequest
	 */
	private processNetworkRequest(request: NetworkRequest, source: NetworkActor) {
		let receivedPackets: Packet[] = Packet.ParseNetworkRequest(request);
		for (const packet of receivedPackets) {
			switch (packet.type) {
				case "handshake": {
					assert(RunService.IsServer(), "Handshake packet received on client");
					if (
						packet.name !== this.lastNodeName ||
						packet.nodes !== this.initialBaseNodeSize
					) {
						(<Player>source).Kick("Invalid Handshake");
					}
					continue;
				}
			}
			let node = this.repicatableNodes.get(packet.nodeid);
			assert(node, "Invalid Node ID");
			switch (packet.type) {
				case "update": {
					if (node instanceof LeafNode) {
						this.handleUpdate(node, packet.value, source);
					} else {
						error("Attempt to update non-leaf node");
					}
					continue;
				}
				case "subscribe": {
					this.handleSubscription(source, node);
					continue;
				}
			}
		}
	}
}
