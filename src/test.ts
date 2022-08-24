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

STATES.GetRoot("Client").GetPlayer(Players.LocalPlayer).Get("Health");

STATES.GetRoot("Public").Get("Mobs");

STATES.GetRoot("Public")
	.Get("Mobs")
	.Subscribe(
		(subtree) => {},
		(subtree) => {},
	);

Players.LocalPlayer;
