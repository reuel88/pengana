import type { SyncEngine } from "@pengana/sync-engine";
import { useEffect } from "react";

import { useStableSyncRef } from "./use-stable-sync-ref";

export function useSyncOnFocus(
	engineRef: React.RefObject<SyncEngine | null>,
	isOnline: boolean,
) {
	const syncRef = useStableSyncRef(engineRef);

	// biome-ignore lint/correctness/useExhaustiveDependencies: syncRef is a stable ref, its .current never triggers re-renders
	useEffect(() => {
		if (!isOnline) return;

		function onVisibilityChange() {
			if (
				typeof document !== "undefined" &&
				document.visibilityState === "visible"
			) {
				syncRef.current();
			}
		}

		document.addEventListener("visibilitychange", onVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", onVisibilityChange);
	}, [isOnline]);
}
