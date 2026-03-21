import type { EnqueueUploadParams } from "../upload";

import { descriptorKey } from "./descriptor-key";
import { RuntimeEntry } from "./runtime-entry";
import type {
	EntryDevtoolsSnapshot,
	EntrySnapshot,
	PlatformDeps,
	RuntimeEntryConfig,
	SyncDescriptor,
} from "./types";

// ---------------------------------------------------------------------------
// SyncRuntime — global registry of long-lived sync entries
// ---------------------------------------------------------------------------

type Listener = () => void;

export class SyncRuntime {
	private entries = new Map<string, RuntimeEntry>();
	private listeners = new Map<string, Set<Listener>>();
	private disposed = false;
	private online: boolean;
	private foreground: boolean;

	private unsubscribeOnline: (() => void) | null = null;
	private unsubscribeForeground: (() => void) | null = null;

	constructor(deps: PlatformDeps) {
		this.online = deps.isOnline();
		this.foreground = deps.isForeground();

		this.unsubscribeOnline = deps.subscribeOnline((online) => {
			this.setOnline(online);
		});
		this.unsubscribeForeground = deps.subscribeForeground((fg) => {
			this.setForeground(fg);
		});
	}

	// ---------------------------------------------------------------------------
	// Entry management
	// ---------------------------------------------------------------------------

	ensure(descriptor: SyncDescriptor, config: RuntimeEntryConfig): void {
		if (this.disposed) return;

		const key = descriptorKey(descriptor);
		if (this.entries.has(key)) return;

		const entry = new RuntimeEntry(config);
		this.entries.set(key, entry);

		// Subscribe to entry changes and forward to per-key listeners
		entry.subscribe(() => {
			const keyListeners = this.listeners.get(key);
			if (keyListeners) {
				for (const listener of keyListeners) {
					listener();
				}
			}
		});

		entry.start(this.online, this.foreground);
	}

	async release(descriptor: SyncDescriptor): Promise<void> {
		const key = descriptorKey(descriptor);
		const entry = this.entries.get(key);
		if (!entry) return;

		this.entries.delete(key);
		this.listeners.delete(key);
		await entry.stop();
	}

	has(descriptor: SyncDescriptor): boolean {
		return this.entries.has(descriptorKey(descriptor));
	}

	// ---------------------------------------------------------------------------
	// Snapshot / Subscription
	// ---------------------------------------------------------------------------

	getSnapshot(descriptor: SyncDescriptor): EntrySnapshot | null {
		const entry = this.entries.get(descriptorKey(descriptor));
		return entry?.getSnapshot() ?? null;
	}

	getDevtoolsSnapshot(
		descriptor: SyncDescriptor,
	): EntryDevtoolsSnapshot | null {
		const entry = this.entries.get(descriptorKey(descriptor));
		return entry?.getDevtoolsSnapshot() ?? null;
	}

	subscribe(descriptor: SyncDescriptor, listener: Listener): () => void {
		const key = descriptorKey(descriptor);
		let keyListeners = this.listeners.get(key);
		if (!keyListeners) {
			keyListeners = new Set();
			this.listeners.set(key, keyListeners);
		}
		keyListeners.add(listener);

		return () => {
			keyListeners.delete(listener);
			if (keyListeners.size === 0) {
				this.listeners.delete(key);
			}
		};
	}

	// ---------------------------------------------------------------------------
	// Actions
	// ---------------------------------------------------------------------------

	triggerSync(descriptor: SyncDescriptor): void {
		const entry = this.entries.get(descriptorKey(descriptor));
		entry?.triggerAllSyncs();
	}

	triggerSyncAll(): void {
		for (const entry of this.entries.values()) {
			entry.triggerAllSyncs();
		}
	}

	enqueueUpload(descriptor: SyncDescriptor, params: EnqueueUploadParams): void {
		const entry = this.entries.get(descriptorKey(descriptor));
		entry?.enqueueUpload(params);
	}

	// ---------------------------------------------------------------------------
	// Online / Foreground
	// ---------------------------------------------------------------------------

	setOnline(online: boolean): void {
		if (this.online === online) return;
		this.online = online;
		for (const entry of this.entries.values()) {
			entry.setOnline(online);
		}
	}

	setForeground(foreground: boolean): void {
		if (this.foreground === foreground) return;
		this.foreground = foreground;
		for (const entry of this.entries.values()) {
			entry.setForeground(foreground);
		}
	}

	// ---------------------------------------------------------------------------
	// Teardown
	// ---------------------------------------------------------------------------

	async shutdownAll(): Promise<void> {
		const entries = [...this.entries.values()];
		this.entries.clear();
		this.listeners.clear();
		await Promise.all(entries.map((e) => e.stop()));
	}

	dispose(): void {
		this.disposed = true;
		this.unsubscribeOnline?.();
		this.unsubscribeForeground?.();
		this.unsubscribeOnline = null;
		this.unsubscribeForeground = null;
		void this.shutdownAll();
	}
}
