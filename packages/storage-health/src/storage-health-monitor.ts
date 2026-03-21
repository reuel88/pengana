import { STORAGE_CRITICAL_RATIO, STORAGE_WARNING_RATIO } from "./constants";
import type { StorageHealthProvider, StorageLevel } from "./types";

const CHECK_INTERVAL_MS = 60_000;

export interface StorageHealthMonitorOptions {
	provider?: StorageHealthProvider;
	onStorageWarning?: () => Promise<void>;
	onStorageCritical?: () => void;
}

export class StorageHealthMonitor {
	private level: StorageLevel = "ok";
	private criticalFired = false;
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private listeners = new Set<() => void>();
	private options: StorageHealthMonitorOptions;

	constructor(options: StorageHealthMonitorOptions) {
		this.options = options;
	}

	/** Start polling. Runs an immediate check, then every 60s. */
	start(): void {
		if (this.intervalId !== null) return;
		void this.check();
		this.intervalId = setInterval(() => void this.check(), CHECK_INTERVAL_MS);
	}

	/** Stop polling and reset state. */
	stop(): void {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.level = "ok";
		this.criticalFired = false;
		this.emitChange();
	}

	/** Current storage level. Stable reference for useSyncExternalStore. */
	getLevel = (): StorageLevel => {
		return this.level;
	};

	/** Subscribe to level changes. Returns unsubscribe function. */
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	/** Run a single health check. */
	async check(): Promise<void> {
		const { provider, onStorageWarning, onStorageCritical } = this.options;
		if (!provider) return;

		const estimate = await provider.estimate();
		if (!estimate) return;

		let newLevel: StorageLevel = "ok";
		if (estimate.usageRatio >= STORAGE_CRITICAL_RATIO) {
			newLevel = "critical";
		} else if (estimate.usageRatio >= STORAGE_WARNING_RATIO) {
			newLevel = "warning";
		}

		this.level = newLevel;
		this.emitChange();

		if (newLevel === "warning" && onStorageWarning) {
			await onStorageWarning();
		}

		if (newLevel === "critical" && !this.criticalFired) {
			this.criticalFired = true;
			onStorageCritical?.();
		}

		if (newLevel !== "critical") {
			this.criticalFired = false;
		}
	}

	private emitChange(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}
}
