import { NodeID } from "../../global/Types";

export namespace Packet {
	export interface Subscribe {
		type: "subscribe";
		// The List of NodeIDs to subscribe to
		requests: NodeID[];
	}

	/**
	 * Creates a Wrapped Subscribe Packet
	 *
	 * @param requests The List of NodeIDs to subscribe to
	 * @returns A Wrapped Subscribe Packet
	 */
	export function Subscribe(requests: NodeID[]): Wrapped<Subscribe> {
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

	/**
	 * Creates a Wrapped Update Packet
	 *
	 * @param targets The List of Targets to send the Update Packet to
	 * @param updates A Map of NodeIDs to new values
	 * @returns A Wrapped Update Packet
	 */
	export function Update(
		targets: NetworkTarget[],
		updates: Record<NodeID, any>,
	): Wrapped<Update> {
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

	/**
	 * Creates a Wrapped Handshake Packet
	 *
	 * @param nodes The number of NodeIDs to expect
	 * @returns A Wrapped Handshake Packet
	 */
	export function Handshake(nodes: number): Wrapped<Handshake> {
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

	/**
	 * Creates a Wrapped Handshake-Response Packet
	 *
	 * @param client The Client to send the Handshake-Response Packet to
	 * @param nodes A List of NodeIDs from a DFS traversal of the trees
	 *
	 * @returns A Wrapped Handshake-Response Packet
	 */
	export function HandshakeResponse(
		client: Player,
		nodes: NodeID[],
	): Wrapped<HandshakeResponse> {
		return {
			targets: [client],
			packet: {
				type: "handshake-response",
				nodes: nodes,
			},
		};
	}

	/**
	 * Unwraps a list of Wrapped Packets into a map of NetworkTargets to NetworkRequests
	 *
	 * @param packets The list of Wrapped Packets to unwrap
	 * @returns A map of NetworkTargets to NetworkRequests
	 */
	export function UnwrapPackets(
		wrappedPackets: Wrapped<any>[],
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

	/**
	 * Generates a NetworkRequest from a list of Packets
	 *
	 * @param packets The list of Packets to generate a NetworkRequest from
	 * @returns A NetworkRequest
	 */
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

	/**
	 * Parses a Network Request back into Packets
	 *
	 * @param request The Network Request to parse
	 * @returns A list of Packets
	 */
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

export type NetworkTarget = Player | "server";

export interface Wrapped<T extends Packet> {
	targets: NetworkTarget[];
	packet: T;
}

export interface NetworkRequest {
	u?: Record<NodeID, any>;
	s?: NodeID[];
	h?: number;
	r?: NodeID[];
}

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
