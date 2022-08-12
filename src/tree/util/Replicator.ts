import { ReplicationMode } from "../../global/Enums";
import { StateNode } from "../StateNode";

export class Replicator {
    public Add(plr: Player|string|number): Replicator {

        return this;
    }

    public Clear(): Replicator {

    }

    public Remove(): Replicator {

    }

    public SetMode(mode: ReplicationMode): Replicator {

    }

    public SetPredicate(func: (plr: Player, node: StateNode) => boolean): Replicator {

    }
}