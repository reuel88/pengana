export type SyncScopeType = "personal" | "organization";

export interface SyncScope {
	scopeType: SyncScopeType;
	scopeId: string;
}
