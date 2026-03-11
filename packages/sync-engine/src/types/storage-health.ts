export interface StorageEstimate {
	usageBytes: number;
	quotaBytes: number;
	usageRatio: number;
}

export type StorageLevel = "ok" | "warning" | "critical";

export interface StorageHealthProvider {
	estimate(): Promise<StorageEstimate | null>;
}
