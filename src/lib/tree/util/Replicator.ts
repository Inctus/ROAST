import { ReplicationMode } from "../../global/Enums";
import { StateNode } from "../StateNode";

export class Replicator {
    public Add(plr: Player|string|number): Replicator {

        return this;
    }

    public Clear(): Replicator {

        return this;
    }

    public Remove(): Replicator {

        return this;
    }

    public SetMode(mode: ReplicationMode): Replicator {

        return this;
    }

    public SetPredicate(func: (plr: Player, node: StateNode) => boolean): Replicator {

        return this;
    }
}