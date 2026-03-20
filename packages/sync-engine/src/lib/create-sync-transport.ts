import type {
	Media,
	MediaAttachment,
	SyncOutput,
	SyncTransport,
	Todo,
} from "../types";

export function createSyncTransport(
	serverSync: (input: {
		changes: Todo[];
		lastSyncedAt: string | null;
		signal?: AbortSignal;
	}) => Promise<{
		serverChanges: Todo[];
		media?: Media[];
		mediaAttachments?: MediaAttachment[];
		conflicts: string[];
		syncedAt: string;
	}>,
	onMedia?: (
		media: Media[],
		mediaAttachments: MediaAttachment[],
		entityIds: string[],
	) => Promise<void>,
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
				await onMedia(
					result.media ?? [],
					result.mediaAttachments ?? [],
					entityIds,
				);
			}
			return {
				serverChanges: result.serverChanges,
				media: result.media ?? [],
				mediaAttachments: result.mediaAttachments ?? [],
				conflicts: result.conflicts,
				syncedAt: result.syncedAt,
			};
		},
	};
}
