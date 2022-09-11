import { ReplicatedStorage, RunService } from "@rbxts/services";
import { Replication } from ".";
import { ReplicatableNodeID } from "../../global/Types";
import { BranchNode } from "../nodes/Branch";
import { LeafNode } from "../nodes/Leaf";
import { IndexableNode, StateNode } from "../nodes/StateNode";
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
		baseNodes.forEach(this.AddReplicatableNode);
		this.initialBaseNodeSize = baseNodes.size();

		if (RunService.IsServer()) {
			this.remoteEvent = new Instance("RemoteEvent");
			this.remoteEvent.Name = remoteEventName;
			this.remoteEvent.Parent = ReplicatedStorage;

			this.remoteEvent.OnServerEvent.Connect((player, request) => {
				assert(request && typeof request == "object");
				this.ProcessNetworkRequest(request, player);
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

		RunService.Heartbeat.Connect(this.ProcessNetworkTick);
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
	 *
	 * @param delta The time since the last tick
	 */
	private ProcessNetworkTick(delta: number) {
		for (const [nodeID, node] of this.repicatableNodes) {
			this.networkQueue.push(
				...Packet.SignAll(node.getReplicator().getNetworkQueue(), nodeID),
			);
			node.getReplicator().clearNetworkQueue();
		}
		let networkRequestMap = Packet.UnwrapPackets(this.networkQueue);
		for (const [target, request] of networkRequestMap) {
			if (target == "server") {
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
						packet.name != this.lastBaseNodeName ||
						packet.nodes != this.initialBaseNodeSize
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
					if (Replication.amOwnerContext(replicator.getScope())) {
						// TRIGGER MIDDLEWARE WITH NEW VALUE
						// IF IT PASSES THEN
						// 	DISTRIBUTE UPDATE TO ALL SUBSCRIBED NETWORK TARGETS
						// 	USING THE REPLICATOR TO GENERATE A PACKET?
						// ELSE
						// 	SEND BACK THE OLD VALUE TO SOURCE AS UPDATE
					} else {
						// UPDATE LOCALLY
					}
					continue;
				}
				case "subscribe": {
					if (Replication.amOwnerContext(replicator.getScope())) {
						if (node instanceof LeafNode) {
							replicator.addSubscribedNetworkActor(source);
							//replicator.generateUpdatePacket( GET NODE VALUE HERE, source);

							// VINES WILL BE ADDED HERE TOO EVENTUALLY?
						} else if (node instanceof BranchNode) {
							// RECURSE DOWN THE TREE
							// ADD SUBSCRIPTIONS TO EACH LEAF NODE AND VINE NODE LMAO
						} else {
							error("Attempt to Subscribe to a non-leaf, non-branch node");
						}
					} else {
						error("Received subscribe packet on client");
					}
					continue;
				}
			}
		}
	}
}
