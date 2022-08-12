import { StateTreeDefinition } from "../global/Types";

export abstract class StateNode {
    public Parent: StateNode | null = null;

    constructor() {}

    public setParent(parent: StateNode) {
        this.Parent = parent;
    }
}

export abstract class ChildCapableStateNode extends StateNode {
    public Children: StateTreeDefinition;

    constructor(children: StateTreeDefinition = {}) {
        super();
        
        this.Children = children;
    }

    public Get(key: string) {
        return this.Children[key];
    }
}