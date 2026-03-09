import type { SyncEngine } from "@pengana/sync-engine";
import { type MutableRefObject, useEffect, useRef } from "react";

const SYNC_INTERVAL_MS = 5 * 60_000;

export function usePeriodicSync(
	effectiveOnline: boolean,
	engineRef: MutableRefObject<SyncEngine | null>,
) {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (effectiveOnline && engineRef.current) {
			intervalRef.current = setInterval(() => {
				engineRef.current?.sync();
			}, SYNC_INTERVAL_MS);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [effectiveOnline, engineRef]);
}
