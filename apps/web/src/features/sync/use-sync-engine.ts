import {
	type SyncEnginePlatformDeps,
	useNetworkStatus,
	useSyncEngineCore,
} from "@pengana/sync-engine";

export function useSyncEngine(
	scopeId: string | undefined,
	deps: SyncEnginePlatformDeps,
	notifyKey?: string,
) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore({ scopeId, isOnline, deps, notifyKey });
}
