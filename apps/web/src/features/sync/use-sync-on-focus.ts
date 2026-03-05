import type { SyncEngine } from "@pengana/sync-engine";
import { useEffect, useRef } from "react";

export function useSyncOnFocus(
	engineRef: React.RefObject<SyncEngine | null>,
	isOnline: boolean,
) {
	const syncRef = useRef<() => void>(() => {});
	syncRef.current = () => {
		engineRef.current?.sync();
	};

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
