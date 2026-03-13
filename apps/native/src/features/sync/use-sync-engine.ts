import {
	type SyncEnginePlatformDeps,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useNetworkStatus } from "./use-network-status";

function useAppIsForeground() {
	const [isForeground, setIsForeground] = useState(
		AppState.currentState === "active",
	);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			setIsForeground(nextAppState === "active");
		});
		return () => subscription.remove();
	}, []);

	return isForeground;
}

export function useSyncEngine(
	scopeId: string | undefined,
	deps: SyncEnginePlatformDeps,
	notifyKey?: string,
) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useAppIsForeground();

	return useSyncEngineCore({
		scopeId,
		isOnline,
		deps,
		isForeground,
		notifyKey,
	});
}
