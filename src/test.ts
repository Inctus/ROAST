import { Players } from "@rbxts/services";
import { ROAST } from ".";
import { Nodes } from "./lib/tree/nodes";

enum MobData {
	SMALL_MINION,
	BIG_MINION,
	GIANT_MINION,
}

enum TurretSize {
	SMALL,
	LARGE,
	CRYSTAL,
}

enum AnimationState {
	IDLE,
	WALK,
	RUN,
	MOB_ANIM_1,
	MOB_ANIM_2,
	MOB_ANIM_3,
	MOB_ANIM_4,
	MOB_ANIM_5,
}

const STATES = ROAST.CreateDefinitions({
	Public: Nodes.PublicServer({
		Mobs: Nodes.Branch({
			Minions: Nodes.Vine((mobData: MobData) => {
				return {
					Health: Nodes.Leaf(100),
					MobID: Nodes.Leaf(mobData),
					Animation: Nodes.Leaf(AnimationState.IDLE),
				};
			}),
			Turrets: Nodes.Vine((turret: TurretSize) => {
				return {
					Health: Nodes.Leaf(
						turret === TurretSize.SMALL
							? 500
							: turret === TurretSize.LARGE
							? 1000
							: 2500,
					),
				};
			}),
			Jungle: Nodes.Vine((mobData: MobData) => {
				return {
					Health: Nodes.Leaf<number>(),
				};
			}),
		}),
	}),

	Client: Nodes.PublicClient((plr) => {
		return {
			Health: Nodes.Leaf<number>(),
		};
	}),

	Server: Nodes.PrivateServer({}),

	Private: Nodes.PrivateClient({}),
});

STATES.GetRoot("Client").getPlayer(Players.LocalPlayer).get("Health");

STATES.GetRoot("Public").get("Mobs");

Players.LocalPlayer;
