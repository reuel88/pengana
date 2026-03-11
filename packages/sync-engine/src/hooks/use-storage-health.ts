import { useCallback, useEffect, useRef, useState } from "react";

import {
	STORAGE_CRITICAL_RATIO,
	STORAGE_WARNING_RATIO,
} from "../constants/sync";
import type { CleanupDeps } from "../core/storage-cleanup";
import { cleanupUploaded } from "../core/storage-cleanup";
import type {
	StorageHealthProvider,
	StorageLevel,
} from "../types/storage-health";

const CHECK_INTERVAL_MS = 60_000;

export interface UseStorageHealthOptions {
	provider?: StorageHealthProvider;
	cleanupDeps?: CleanupDeps;
	onStorageCritical?: () => void;
}

export function useStorageHealth(options: UseStorageHealthOptions) {
	const { provider, cleanupDeps, onStorageCritical } = options;
	const [storageLevel, setStorageLevel] = useState<StorageLevel>("ok");
	const criticalFiredRef = useRef(false);

	const check = useCallback(async () => {
		if (!provider) return;

		const estimate = await provider.estimate();
		if (!estimate) return;

		let level: StorageLevel = "ok";
		if (estimate.usageRatio >= STORAGE_CRITICAL_RATIO) {
			level = "critical";
		} else if (estimate.usageRatio >= STORAGE_WARNING_RATIO) {
			level = "warning";
		}

		setStorageLevel(level);

		if (level === "warning" && cleanupDeps) {
			await cleanupUploaded(cleanupDeps);
		}

		if (level === "critical" && !criticalFiredRef.current) {
			criticalFiredRef.current = true;
			onStorageCritical?.();
		}

		if (level !== "critical") {
			criticalFiredRef.current = false;
		}
	}, [provider, cleanupDeps, onStorageCritical]);

	useEffect(() => {
		check();
		const id = setInterval(check, CHECK_INTERVAL_MS);
		return () => clearInterval(id);
	}, [check]);

	return { storageLevel };
}
