import ClientAsyncFunction from "@rbxts/net/out/client/ClientAsyncFunction";

export type GUID = string;

export namespace Packet {
	export interface SubscribePacket {
		type: "subscribe";
		nodeid: GUID;
	}

	export interface UnsubscribePacket {
		type: "unsubscribe";
		nodeid: GUID;
	}

	export interface UpdatePacket {
		type: "update";
		map: Record<GUID, any>;
	}

	export interface HandshakeToServer {
		type: "handshake";
		/** Number of nodes. */
		data: number;
	}

	export interface HandshakeToClient {
		type: "handshake";
		/** `data` should contain everything in the same order on client and server. */
		data: GUID[];
	}

	export interface VineUpdatePacket {
		type: "vineupdate";
		nodeid: GUID;
		compute: {
			type: "add" | "remove";
			map: Record<GUID, any>;
		}[];
	}
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
