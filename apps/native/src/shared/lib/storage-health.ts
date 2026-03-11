import type {
	StorageEstimate,
	StorageHealthProvider,
} from "@pengana/sync-engine";
import { Paths } from "expo-file-system";

const WARNING_FREE_BYTES = 100 * 1024 * 1024; // 100 MB
const CRITICAL_FREE_BYTES = 20 * 1024 * 1024; // 20 MB

export function createNativeStorageHealthProvider(): StorageHealthProvider {
	return {
		async estimate(): Promise<StorageEstimate | null> {
			const free = Paths.availableDiskSpace;
			const total = Paths.totalDiskSpace;

			if (!total || total === 0) return null;

			const usage = total - free;
			return {
				usageBytes: usage,
				quotaBytes: total,
				usageRatio: usage / total,
			};
		},
	};
}

export { WARNING_FREE_BYTES, CRITICAL_FREE_BYTES };
