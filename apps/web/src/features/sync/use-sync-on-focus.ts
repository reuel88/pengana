import type { SyncEngine } from "@pengana/sync-engine";
import { useStableSyncRef } from "@pengana/sync-engine";
import { useEffect } from "react";

export function useSyncOnFocus(
	engineRef: React.RefObject<SyncEngine | null>,
	isOnline: boolean,
) {
	const syncRef = useStableSyncRef(engineRef);

	// biome-ignore lint/correctness/useExhaustiveDependencies: syncRef is a stable ref, its .current never triggers re-renders
	useEffect(() => {
		if (!isOnline) return;

		function onVisibilityChange() {
			if (document.visibilityState === "visible") {
				syncRef.current();
			}
		}

		document.addEventListener("visibilitychange", onVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", onVisibilityChange);
	}, [isOnline]);
}
