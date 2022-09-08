import { NodeID } from "../../global/Types";

export namespace Packet {
	export interface Subscribe {
		type: "subscribe";
		// The List of NodeIDs to subscribe to
		requests: NodeID[];
	}

	export function Subscribe(requests: NodeID[]): Wrapped {
		return {
			targets: ["server"],
			packet: {
				type: "subscribe",
				requests: requests,
			},
		};
	}

	export interface Update {
		type: "update";
		// A Map of NodeIDs to new values
		updates: Record<NodeID, any>;
	}

	export function Update(
		targets: NetworkTarget[],
		updates: Record<NodeID, any>,
	): Wrapped {
		return {
			targets: targets,
			packet: {
				type: "update",
				updates: updates,
			},
		};
	}

	export interface Handshake {
		type: "handshake";
		// The number of NodeIDs to expect
		nodes: number;
	}

	export function Handshake(nodes: number): Wrapped {
		return {
			targets: ["server"],
			packet: {
				type: "handshake",
				nodes: nodes,
			},
		};
	}

	export interface HandshakeResponse {
		type: "handshake-response";
		// A List of NodeIDs from a DFS traversal of the trees
		nodes: NodeID[];
	}

	export function HandshakeResponse(client: Player, nodes: NodeID[]): Wrapped {
		return {
			targets: [client],
			packet: {
				type: "handshake-response",
				nodes: nodes,
			},
		};
	}

	export interface Wrapped {
		targets: NetworkTarget[];
		packet: Packet;
	}

	export function UnwrapPackets(
		wrappedPackets: Wrapped[],
	): Map<NetworkTarget, NetworkRequest> {
		let contextMapped = new Map<NetworkTarget, Packet[]>();
		for (let wrappedPacket of wrappedPackets) {
			for (let target of wrappedPacket.targets) {
				if (!contextMapped.has(target)) {
					contextMapped.set(target, []);
				}
				contextMapped.get(target)!.push(wrappedPacket.packet);
			}
		}
		let networkRequestMap = new Map<NetworkTarget, NetworkRequest>();
		for (let [target, packets] of contextMapped) {
			networkRequestMap.set(target, GenerateNetworkRequest(packets));
		}
		return networkRequestMap;
	}

	function GenerateNetworkRequest(packets: Packet[]): NetworkRequest {
		let updates: Record<NodeID, any> = {};
		let subscriptions: NodeID[] = [];
		let handshake: number | undefined;
		let response: NodeID[] | undefined;

		for (const packet of packets) {
			switch (packet.type) {
				case "update": {
					for (const [node, value] of pairs(packet.updates)) {
						updates[node] = value;
					}
					break;
				}
				case "subscribe": {
					subscriptions.push(...packet.requests);
					break;
				}
				case "handshake": {
					handshake = packet.nodes;
					break;
				}
				case "handshake-response": {
					response = packet.nodes;
					break;
				}
			}
		}

		return {
			u: updates.size() > 0 ? updates : undefined,
			s: subscriptions.size() > 0 ? subscriptions : undefined,
			h: handshake,
			r: response,
		};
	}

	export function ParseNetworkRequest(request: NetworkRequest): Packet[] {
		const packets: Packet[] = [];

		if (request.u) {
			packets.push({
				type: "update",
				updates: request.u,
			});
		}

		if (request.s) {
			packets.push({
				type: "subscribe",
				requests: request.s,
			});
		}

		if (request.h) {
			packets.push({
				type: "handshake",
				nodes: request.h,
			});
		}

		if (request.r) {
			packets.push({
				type: "handshake-response",
				nodes: request.r,
			});
		}

		return packets;
	}

	// export interface VineUpdatePacket {
	// 	type: "vineupdate";
	// 	nodeid: GUID;
	// 	compute: {
	// 		type: "add" | "remove";
	// 		map: Record<GUID, any>;
	// 	}[];
	// }
}

export type Packet =
	| Packet.Subscribe
	| Packet.Update
	| Packet.Handshake
	| Packet.HandshakeResponse;

export interface NetworkRequest {
	u?: Record<NodeID, any>;
	s?: NodeID[];
	h?: number;
	r?: NodeID[];
}

export type NetworkTarget = Player | "server";

// let x = {
// 	type: "vineupdate",
// 	nodeid: "...",
// 	compute: [
// 		{
// 			type: "add",
// 			map: {
// 				"GUID of the Position of that": "...",
// 			},
// 		},
// 	],
// };
