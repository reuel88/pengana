import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import { useStableSyncRef } from "./use-stable-sync-ref";

export const SYNC_INTERVAL_MS = 5 * 60_000;

interface Syncable {
	sync(): Promise<void>;
}

export function usePeriodicSync(
	isOnline: boolean,
	engineRef: RefObject<Syncable | null>,
) {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const syncRef = useStableSyncRef(engineRef);

	// biome-ignore lint/correctness/useExhaustiveDependencies: syncRef is a stable ref, its .current never triggers re-renders
	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (isOnline) {
			intervalRef.current = setInterval(() => {
				syncRef.current();
			}, SYNC_INTERVAL_MS);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isOnline]);
}
