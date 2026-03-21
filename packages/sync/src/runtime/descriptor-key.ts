import type { SyncDescriptor } from "./types";

export function descriptorKey(d: SyncDescriptor): string {
	return `${d.scopeType}:${d.scopeId}:${d.entityKey}`;
}
