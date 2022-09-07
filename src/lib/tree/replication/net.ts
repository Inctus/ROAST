import ClientAsyncFunction from "@rbxts/net/out/client/ClientAsyncFunction";

export type NodeID = string;

export namespace Packet {
	// Subscription packet triggered from Get request
	export type Get = Subscribe;

	// Update packet triggered from Set request
	export type Set = Update;

	export interface Subscribe {
		type: "subscribe";
		// The List of NodeIDs to subscribe to
		requests: NodeID[];
	}

	export interface Update {
		type: "update";
		// A Map of NodeIDs to new values
		updates: Record<NodeID, any>;
	}

	export interface Handshake {
		type: "handshake";
		// The number of NodeIDs to expect
		count: number;
	}

	// Returned Update packet from Get request
	export type GetResponse = Update;

	// Returned Update packet from Set request
	export type SetResponse = Update;

	export interface HandshakeResponse {
		type: "handshake-response";
		// A List of NodeIDs from a DFS traversal of the trees
		nodes: NodeID[];
	}

	export interface Response {
		type: "response";
		client: Player;
		// The packet wrapped for response
		packet: GetResponse | SetResponse | HandshakeResponse;
	}

	export type Packet = Subscribe | Update | Handshake | HandshakeResponse;
	export interface NetworkRequest {
		u?: Record<NodeID, any>;
		s?: NodeID[];
		h?: number;
		r?: NodeID[];
	}

	function generateNetworkRequest(packets: Packet[]): NetworkRequest {
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
					handshake = packet.count;
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

	function parseNetworkRequest(request: NetworkRequest): Packet[] {
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
				count: request.h,
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
