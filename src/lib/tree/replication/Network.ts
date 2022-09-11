import { ReplicatedStorage, RunService } from "@rbxts/services";
import { Replication } from ".";
import { ReplicatableNodeID } from "../../global/Types";
import { BranchNode } from "../nodes/Branch";
import { LeafNode } from "../nodes/Leaf";
import { StateNode } from "../nodes/StateNode";
import { VineNode } from "../nodes/Vine";
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
	private readonly repicatableNodes: Map<ReplicatableNodeID, StateNode> = new Map();
	private readonly initialBaseNodeSize: number;
	private currentNodeID: ReplicatableNodeID = 0;

	// Pre: Tree is built
	constructor(
		remoteEventName: string,
		baseNodes: StateNode[],
		private readonly lastBaseNodeName: string,
	) {
		baseNodes.forEach((v) => this.AddReplicatableNode(v));
		this.initialBaseNodeSize = baseNodes.size();

		if (RunService.IsServer()) {
			this.remoteEvent = new Instance("RemoteEvent");
			this.remoteEvent.Name = remoteEventName;
			this.remoteEvent.Parent = ReplicatedStorage;

			this.remoteEvent.OnServerEvent.Connect((player, request) => {
				assert(request && typeOf(request) === "table");
				// TODO: Typecheck this.
				this.ProcessNetworkRequest(request as NetworkRequest, player);
			});
		} else {
			this.remoteEvent = ReplicatedStorage.WaitForChild(
				remoteEventName,
			) as RemoteEvent;

			this.networkQueue.push(
				Packet.Handshake(this.initialBaseNodeSize, this.lastBaseNodeName),
			);

			this.remoteEvent.OnClientEvent.Connect((request: NetworkRequest) => {
				this.ProcessNetworkRequest(request, "server");
			});
		}

		RunService.Heartbeat.Connect(() => this.ProcessNetworkTick());
	}

	private AddReplicatableNode(node: StateNode) {
		this.repicatableNodes.set(this.currentNodeID, node);
		this.currentNodeID++;
	}

	private RemoveReplicatableNode(nodeID: ReplicatableNodeID) {
		this.repicatableNodes.delete(nodeID);
	}

	/**
	 * Processes and Dispatches the Network Queue
	 */
	private ProcessNetworkTick() {
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

	/**
	 * Processes a NetworkRequest
	 *
	 * @param request The incoming NetworkRequest to process
	 * @param source The source of the NetworkRequest
	 */
	private ProcessNetworkRequest(request: NetworkRequest, source: NetworkActor) {
		let receivedPackets: Packet[] = Packet.ParseNetworkRequest(request);
		for (const packet of receivedPackets) {
			// Unsigned Packets
			switch (packet.type) {
				case "handshake": {
					assert(RunService.IsServer(), "Handshake packet received on client");
					if (
						packet.name !== this.lastBaseNodeName ||
						packet.nodes !== this.initialBaseNodeSize
					) {
						(<Player>source).Kick("Invalid Handshake");
					}
					continue;
				}
			}
			// Signed Packets
			let node = this.repicatableNodes.get(packet.nodeid);
			assert(node, "Invalid Node ID");
			let replicator = node.getReplicator();
			switch (packet.type) {
				case "update": {
					if (node instanceof LeafNode) {
						if (Replication.amOwnerActor(replicator.getScope())) {
							// TODO() -> RUN MIDDLEWARE
							let middlewarePass: boolean = true;
							if (middlewarePass) {
								node.setValue(packet.value, source);
							} else {
								replicator.replicateUpdateTo(node.getValue(), source);
							}
						} else {
							node.setValue(packet.value);
						}
					} else {
						error("Attempt to update non-leaf node");
					}
					continue;
				}
				case "subscribe": {
					if (Replication.amOwnerActor(replicator.getScope())) {
						if (node instanceof LeafNode) {
							replicator.addSubscribedNetworkActor(source);
							replicator.replicateUpdateTo(node.getValue(), source);
						} else if (node instanceof BranchNode) {
							// RECURSE DOWN THE TREE
							// ADD SUBSCRIPTIONS TO EACH LEAF NODE AND VINE NODE LMAO
							// GENERATE UPDATE PACKETS FOR EACH LEAF NODE AND VINE NODE
						} else if (node instanceof VineNode) {
							// ADD SUBSCRIPTION TO VINE NODE
						} else {
							error("Attempt to subscribe to non-subscribable node");
						}
					} else {
						error("Received a subscribe packet on a non-owner context");
					}
					continue;
				}
			}
		}
	}
}
