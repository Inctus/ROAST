import { ReplicatedStorage, RunService } from "@rbxts/services";
import { StateTreeDefinition } from "../../global/Types";
import { Definition } from "../definitions";
import { NetworkRequest, NetworkTarget, Packet, UnsignedPacket, Wrapped } from "./Packet";

export class Network<T extends StateTreeDefinition> {
	/**
	 * Handles the Networking of the State Tree
	 *
	 *
	 * @param remoteEventName The name of the RemoteEvent to use for networking
	 * @param tree The State Tree to network
	 * @returns A Network object that handles the networking of the State Tree
	 */
	private readonly remoteEvent;
	private networkQueue: Wrapped<Packet>[] = [];

	// Pre: Tree is built
	constructor(remoteEventName: string, private tree: Definition<T>) {
		if (RunService.IsServer()) {
			this.remoteEvent = new Instance("RemoteEvent");
			this.remoteEvent.Name = remoteEventName;
			this.remoteEvent.Parent = ReplicatedStorage;

			// ASSIGN NODEIDS AND SETUP HANDSHAKE RESPONSE
			// CACHE IT
			this.remoteEvent.OnServerEvent.Connect((player, request) => {
				assert(request && typeof request == "object");
				this.ProcessNetworkRequest(request, player);
			});
		} else {
			this.remoteEvent = ReplicatedStorage.WaitForChild(
				remoteEventName,
			) as RemoteEvent;

			this.networkQueue.push(
				Packet.Handshake(this.tree.GetReplicatableNodes().size()),
			);
			this.remoteEvent.OnClientEvent.Connect((request: NetworkRequest) => {
				this.ProcessNetworkRequest(request, "server");
			});
		}
		RunService.Heartbeat.Connect(this.ProcessNetworkTick);
	}

	/**
	 * Processes and Dispatches the Network Queue
	 *
	 * @param delta The time since the last tick
	 */
	private ProcessNetworkTick(delta: number) {
		for (const node of this.tree.GetReplicatableNodes()) {
			// IF THE NODE HAS AN ID THEN
			// GRAB THE REPLICATOR'S UNSIGNED PACKET QUEUE
			// SIGN AND APPEND THE UNSIGNED PACKETS TO THE NETWORK QUEUE
		}
		let networkRequestMap = Packet.UnwrapPackets(this.networkQueue);
		for (const [target, request] of networkRequestMap) {
			if (target == "server") {
				this.remoteEvent.FireServer(request);
			} else {
				this.remoteEvent.FireClient(target, request);
			}
		}
		this.networkQueue = [];
	}

	/**
	 * Processes a NetworkRequest
	 *
	 * @param request The incoming NetworkRequest to process
	 * @param source The source of the NetworkRequest
	 */
	private ProcessNetworkRequest(request: NetworkRequest, source: NetworkTarget) {
		let receivedPackets: Packet[] = Packet.ParseNetworkRequest(request);
		for (const packet of receivedPackets) {
			switch (packet.type) {
				case "handshake": {
					// IF I AM THE CLIENT, ERROR
					// IF I AM THE SERVER, SEND HANDSHAKE RESPONSE
					break;
				}
				case "handshake-response": {
					// IF I AM THE SERVER, ERROR
					// OTHERWISE ASSIGN THE HANDSHAKE RESPONSE IDS TO THE REPLICATABLE NODES
					break;
				}
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
