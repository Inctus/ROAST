import { Players } from "@rbxts/services";
import { ROAST } from ".";
import { Nodes } from "./lib/tree/nodes";

const STATES = ROAST.CreateDefinitions({
	Public: Nodes.PublicServer({
		Mobs: Nodes.Vine((str: string) => {
			return {};
		}),
	}),

	Death: Nodes.RestrictedPublic({
		Died: Nodes.Leaf<boolean>(),
	}),

	Client: Nodes.PublicClient((plr) => {
		return {
			Health: Nodes.Leaf<number>(),
		};
	}),
});

STATES.GetScope("Client").GetPlayer(Players.LocalPlayer).Get("Health");

STATES.GetScope("Public").Get("Mobs").Add();

Players.LocalPlayer;
