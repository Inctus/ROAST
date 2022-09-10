import { ReplicatedStorage, RunService } from "@rbxts/services";
import { ReplicatableNodeID } from "../../global/Types";
import { StateNode } from "../nodes/StateNode";
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
	private currentNodeID: ReplicatableNodeID = 0;

	private readonly initialBaseNodeSize: number;

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
				...Packet.SignAll(node.GetReplicator().getNetworkQueue(), nodeID),
			);
			node.GetReplicator().clearNetworkQueue();
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
			switch (packet.type) {
				case "update": {
					// RETRIEVE NODE
					// IF I AM THE OWNER CONTEXT, UPDATE NODE
					// DISTRIBUTE UPDATE TO ALL SUBSCRIBED NETWORK TARGETS
					// USING THE REPLICATOR TO GENERATE A PACKET?
					// OTHERWISE JUST UPDATE LOCALLY
					break;
				}
				case "subscribe": {
					// RETRIEVE NODE
					// IF I AM NOT THE OWNER CONTEXT, ERROR
					// OTHERWISE ADD THE SOURCE TO THE SUBSCRIBERS OF THE NODE
					// RETURN AN UPDATE PACKET TO THE SOURCE
					break;
				}
			}
		}
	}
}
