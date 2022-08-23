import { ROAST } from ".";
import { Leaf } from "./lib/tree/nodes/Leaf";

const STATES = ROAST.CreateDefinitions({
	MatchmakingActive: new Leaf(true),
	Stuff: new Leaf(0),
});
