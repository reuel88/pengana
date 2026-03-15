import type {
	Media,
	SyncOutput,
	SyncTransport,
	Todo,
} from "@pengana/sync-engine";

export function createOrgSyncTransport(
	serverSync: (input: {
		changes: Array<
			Omit<Todo, "userId"> & {
				organizationId: string;
				createdBy: string | null;
			}
		>;
		lastSyncedAt: string | null;
		signal?: AbortSignal;
	}) => Promise<{
		serverChanges: Array<Omit<Todo, "userId"> & { organizationId: string }>;
		media?: Media[];
		conflicts: string[];
		syncedAt: string;
	}>,
	onMedia?: (media: Media[], entityIds: string[]) => Promise<void>,
): SyncTransport {
	return {
		async sync(input): Promise<SyncOutput> {
			const orgInput = {
				changes: input.changes.map((c) => ({
					...c,
					organizationId: c.userId,
					createdBy: null as string | null,
				})),
				lastSyncedAt: input.lastSyncedAt,
				signal: input.signal,
			};
			const result = await serverSync(orgInput);
			const entityIds = result.serverChanges.map((c) => c.id);
			if (onMedia && entityIds.length > 0) {
				await onMedia(result.media ?? [], entityIds);
			}
			return {
				...result,
				media: result.media ?? [],
				serverChanges: result.serverChanges.map((s) => ({
					...s,
					userId: s.organizationId,
				})),
			};
		},
	};
}
