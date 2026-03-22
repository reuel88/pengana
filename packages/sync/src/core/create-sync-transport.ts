import type {
	Media,
	MediaAttachment,
	SyncOutput,
	SyncTransport,
	Todo,
} from "./types";

export function createSyncTransport(
	serverSync: (
		input: {
			changes: Todo[];
			lastSyncedAt: string | null;
		},
		signal?: AbortSignal,
	) => Promise<{
		serverChanges: Todo[];
		media?: Media[];
		mediaAttachments?: MediaAttachment[];
		conflicts: string[];
		syncedAt: string;
	}>,
): SyncTransport {
	return {
		async sync(input): Promise<SyncOutput> {
			const result = await serverSync(
				{
					changes: input.changes,
					lastSyncedAt: input.lastSyncedAt,
				},
				input.signal,
			);
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
