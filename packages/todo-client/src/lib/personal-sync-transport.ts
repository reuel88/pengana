import type { SyncOutput, SyncTransport, Todo } from "@pengana/sync-engine";

/**
 * Creates a SyncTransport for personal (non-org) todos.
 *
 * Wraps the server sync RPC call, matching the SyncTransport interface
 * expected by the sync engine.
 */
export function createPersonalSyncTransport(
	serverSync: (input: {
		changes: Todo[];
		lastSyncedAt: string | null;
		signal?: AbortSignal;
	}) => Promise<SyncOutput>,
): SyncTransport {
	return {
		async sync(input) {
			return serverSync(input);
		},
	};
}
