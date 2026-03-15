import type {
	Media,
	SyncOutput,
	SyncTransport,
	Todo,
} from "@pengana/sync-engine";

export function createSyncTransport(
	serverSync: (input: {
		changes: Todo[];
		lastSyncedAt: string | null;
		signal?: AbortSignal;
	}) => Promise<{
		serverChanges: Todo[];
		media?: Media[];
		conflicts: string[];
		syncedAt: string;
	}>,
	onMedia?: (media: Media[], entityIds: string[]) => Promise<void>,
): SyncTransport {
	return {
		async sync(input): Promise<SyncOutput> {
			const result = await serverSync({
				changes: input.changes,
				lastSyncedAt: input.lastSyncedAt,
				signal: input.signal,
			});
			const entityIds = result.serverChanges.map((c) => c.id);
			if (onMedia && entityIds.length > 0) {
				await onMedia(result.media ?? [], entityIds);
			}
			return {
				serverChanges: result.serverChanges,
				media: result.media ?? [],
				conflicts: result.conflicts,
				syncedAt: result.syncedAt,
			};
		},
	};
}
