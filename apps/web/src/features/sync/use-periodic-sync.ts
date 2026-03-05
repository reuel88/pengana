import type { SyncEngine } from "@pengana/sync-engine";

import { useEffect, useRef } from "react";

const SYNC_INTERVAL_MS = 5 * 60_000;

export function usePeriodicSync(
	isOnline: boolean,
	engineRef: React.RefObject<SyncEngine | null>,
) {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Stable ref that always calls the latest engineRef.current?.sync
	const syncRef = useRef<() => void>(() => {});

	// update the syncRef on each render so it always calls the latest engine
	syncRef.current = () => {
		engineRef.current?.sync();
	};

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
