import type { SyncScope } from "@/shared/api/background-messages";

export function scopeKey(scope: SyncScope): string {
	return `${scope.scopeType}:${scope.scopeId}`;
}

export function isSyncScope(value: unknown): value is SyncScope {
	if (!value || typeof value !== "object") return false;

	const scope = value as Partial<SyncScope>;
	return (
		(scope.scopeType === "personal" || scope.scopeType === "organization") &&
		typeof scope.scopeId === "string" &&
		scope.scopeId.length > 0
	);
}

export function mergeScopes(...groups: SyncScope[][]): SyncScope[] {
	const merged = new Map<string, SyncScope>();
	for (const scopes of groups) {
		for (const scope of scopes) {
			merged.set(scopeKey(scope), scope);
		}
	}
	return [...merged.values()];
}
