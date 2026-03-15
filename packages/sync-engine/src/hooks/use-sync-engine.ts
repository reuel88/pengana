import { useNetworkStatus } from "./use-network-status";
import type { SyncEnginePlatformDeps } from "./use-sync-engine-core";
import { useSyncEngineCore } from "./use-sync-engine-core";

/**
 * Web/extension sync engine hook. For native, use `useSyncEngineCore` directly
 * with platform-specific `isForeground` detection.
 */
export function useSyncEngine(
	scopeId: string | undefined,
	deps: SyncEnginePlatformDeps,
	notifyKey?: string,
) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore({ scopeId, isOnline, deps, notifyKey });
}
