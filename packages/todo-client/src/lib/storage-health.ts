import type {
	StorageEstimate,
	StorageHealthProvider,
	StorageLevel,
} from "@pengana/sync-engine";

import {
	STORAGE_CRITICAL_RATIO,
	STORAGE_WARNING_RATIO,
} from "@pengana/sync-engine";

export function createWebStorageHealthProvider(): StorageHealthProvider {
	return {
		async estimate(): Promise<StorageEstimate | null> {
			if (!navigator?.storage?.estimate) return null;

			const { usage, quota } = await navigator.storage.estimate();
			if (!usage || !quota) return null;

			return {
				usageBytes: usage,
				quotaBytes: quota,
				usageRatio: usage / quota,
			};
		},
	};
}

export function getStorageLevel(ratio: number): StorageLevel {
	if (ratio >= STORAGE_CRITICAL_RATIO) return "critical";
	if (ratio >= STORAGE_WARNING_RATIO) return "warning";
	return "ok";
}
