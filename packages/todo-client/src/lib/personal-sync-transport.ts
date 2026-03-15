import type {
	Media,
	SyncOutput,
	SyncTransport,
	Todo,
} from "@pengana/sync-engine";

export function createPersonalSyncTransport(
	serverSync: (input: {
		changes: Todo[];
		lastSyncedAt: string | null;
		signal?: AbortSignal;
	}) => Promise<SyncOutput>,
	onMedia?: (media: Media[], entityIds: string[]) => Promise<void>,
): SyncTransport {
	return {
		async sync(input) {
			const result = await serverSync(input);
			const entityIds = result.serverChanges.map((c) => c.id);
			if (onMedia && entityIds.length > 0) {
				await onMedia(result.media ?? [], entityIds);
			}
			return result;
		},
	};
}
