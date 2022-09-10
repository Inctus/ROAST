import { ReplicatableNodeID } from "../../global/Types";

export type NetworkActor = Player | "server";
export type Packet = Packet.Update | Packet.Subscribe | Packet.Handshake;
export type SignablePacket = Packet.Update | Packet.Subscribe;
export type Unsigned<T extends SignablePacket> = Omit<T, "nodeid">;
export interface Wrapped<T extends Packet | Unsigned<SignablePacket>> {
	targets: NetworkActor[];
	packet: T;
}

export interface NetworkRequest {
	u?: Record<ReplicatableNodeID, any>;
	s?: ReplicatableNodeID[];
	h?: number;
	r?: ReplicatableNodeID[];
}

export namespace Packet {
	export interface Subscribe {
		type: "subscribe";
		// The NodeID being subscribed to
		nodeid: ReplicatableNodeID;
	}

	/**
	 * Creates a Wrapped Subscribe Packet
	 *
	 * @param requests The List of NodeIDs to subscribe to
	 * @returns A Wrapped Subscribe Packet
	 */
	export function Subscribe(): Wrapped<Unsigned<Subscribe>> {
		return {
			targets: ["server"],
			packet: {
				type: "subscribe",
			},
		};
	}

	export interface Update {
		type: "update";
		// The NodeID being updated
		nodeid: ReplicatableNodeID;
		// The new value of the Node
		value: any;
	}

	/**
	 * Creates a Wrapped Update Packet
	 *
	 * @param targets The List of Targets to send the Update Packet to
	 * @param updates A Map of NodeIDs to new values
	 * @returns A Wrapped Update Packet
	 */
	export function Update(
		targets: NetworkActor[],
		value: any,
	): Wrapped<Unsigned<Update>> {
		return {
			targets: targets,
			packet: {
				type: "update",
				value: value,
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

	export function Sign<T extends SignablePacket>(
		packet: Unsigned<T>,
		nodeID: ReplicatableNodeID,
	): T {
		switch (packet.type) {
			case "subscribe":
				return {
					type: "subscribe",
					nodeid: nodeID,
				} as T;
			case "update":
				return {
					type: "update",
					nodeid: nodeID,
					value: (<Unsigned<Update>>packet).value,
				} as T;
			default:
				error("Invalid Packet Type");
		}
	}

	export function SignAll(
		unsigned: Wrapped<Unsigned<SignablePacket>>[],
		nodeID: ReplicatableNodeID,
	): Wrapped<Packet>[] {
		for (const packet of unsigned) {
			packet.packet = Sign(packet.packet, nodeID);
		}
		return unsigned as Wrapped<Packet>[];
	}

	/**
	 * Unwraps a list of Wrapped Packets into a map of NetworkTargets to NetworkRequests
	 *
	 * @param packets The list of Wrapped Packets to unwrap
	 * @returns A map of NetworkTargets to NetworkRequests
	 */
	export function UnwrapPackets(
		wrappedPackets: Wrapped<Packet>[],
	): Map<NetworkActor, NetworkRequest> {
		let contextMapped = new Map<NetworkActor, Packet[]>();
		for (const wrappedPacket of wrappedPackets) {
			for (const target of wrappedPacket.targets) {
				if (!contextMapped.has(target)) {
					contextMapped.set(target, []);
				}
				contextMapped.get(target)!.push(wrappedPacket.packet);
			}
		}
		let networkRequestMap = new Map<NetworkActor, NetworkRequest>();
		for (const [target, packets] of contextMapped) {
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
		let updates: Record<ReplicatableNodeID, any> = {};
		let subscriptions: ReplicatableNodeID[] = [];
		let handshake: number | undefined;
		let response: ReplicatableNodeID[] | undefined;

		for (const packet of packets) {
			switch (packet.type) {
				case "update": {
					updates[packet.nodeid] = packet.value;
					break;
				}
				case "subscribe": {
					subscriptions.push(packet.nodeid);
					break;
				}
				case "handshake": {
					handshake = packet.nodes;
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
			for (const [nodeid, value] of pairs(request.u)) {
				packets.push({
					type: "update",
					nodeid: nodeid,
					value: value,
				});
			}
		}

		if (request.s) {
			for (const nodeid of request.s) {
				packets.push({
					type: "subscribe",
					nodeid: nodeid,
				});
			}
		}

		if (request.h) {
			packets.push({
				type: "handshake",
				nodes: request.h,
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
