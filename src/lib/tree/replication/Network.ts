import { ReplicatedStorage, RunService } from "@rbxts/services";
import { StateTreeDefinition } from "../../global/Types";
import { Definition } from "../definitions";
import { NetworkRequest, NetworkTarget, Packet } from "./Packet";

export class Network<T extends StateTreeDefinition> {
	private readonly remoteEvent;
	private networkQueue: Packet.Wrapped[] = [];

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

	private ProcessNetworkTick() {
		for (const node of this.tree.GetReplicatableNodes()) {
			// ID NODE IS ASSIGNED A UUID YET
			// GET NEW WRAPPED PACKETS
			// ADD THEM TO THE NETWORK QUEUE
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
