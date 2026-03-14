import type { SyncOutput, SyncTransport, Todo } from "@pengana/sync-engine";

/**
 * Creates a SyncTransport that maps between the local 2do schema (keyed by userId)
 * and the server's OrgTodo schema (keyed by organizationId + createdBy).
 *
 * This remapping allows the sync engine to treat org todos identically to personal
 * todos locally, while the server stores them with organization-scoped fields.
 */
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
		conflicts: string[];
		syncedAt: string;
	}>,
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
			return {
				...result,
				serverChanges: result.serverChanges.map((s) => ({
					...s,
					userId: s.organizationId,
				})),
			};
		},
	};
}
