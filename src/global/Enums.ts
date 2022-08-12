export enum DefaultMode {
    PREDICATE, // Parent is updated.
    PARENT // Parent is set to null.
}

export enum ReplicationMode {
    Whitelist,
    Blacklist,
    Predicate,
    All,
    None
}