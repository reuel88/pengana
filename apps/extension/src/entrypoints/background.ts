import { env } from "@pengana/env/web";
import type { SyncInput, SyncOutput } from "@pengana/sync-engine";
import {
	cleanupUploaded,
	STORAGE_CRITICAL_RATIO,
	STORAGE_WARNING_RATIO,
	SyncEngine,
	UploadQueue,
} from "@pengana/sync-engine";
import {
	createDexieOrgSyncAdapter,
	createDexieSyncAdapter,
	createTodoUploadLifecycleCallbacks,
	createWebUploadAdapter,
	removeFileFromIndexedDB,
} from "@pengana/todo-client";
import { createWebStorageHealthProvider } from "@pengana/todo-client/lib/storage-health";
import { createIndexedDbUploadTransport } from "@/features/sync/entities/upload-queue";
import type { SyncScope } from "@/shared/api/background-messages";
import { client } from "@/shared/api/orpc";
import { sessionResponseSchema } from "@/shared/api/session-schema";
import { appDb } from "@/shared/db";

// --- Constants ---

const SYNC_ALARM_NAME = "periodic-sync";
const SYNC_INTERVAL_MINUTES = 0.5; // 30 seconds
const SCOPES_STORAGE_KEY = "sync-scopes";

// --- State ---

let popupAlive = false;
let isOnline = true;
const engines = new Map<
	string,
	{ engine: SyncEngine; uploadQueue: UploadQueue }
>();

const storageHealthProvider = createWebStorageHealthProvider();
const uploadAdapter = createWebUploadAdapter();

// --- Helpers ---

function scopeKey(scope: SyncScope): string {
	return `${scope.scopeType}:${scope.scopeId}`;
}

async function fetchUserId(): Promise<string | null> {
	try {
		const res = await fetch(`${env.VITE_SERVER_URL}/api/auth/get-session`, {
			credentials: "include",
		});
		if (!res.ok) return null;
		const parsed = sessionResponseSchema.safeParse(await res.json());
		if (!parsed.success) return null;
		return parsed.data.session?.userId ?? parsed.data.user?.id ?? null;
	} catch {
		return null;
	}
}

function createEngine(scope: SyncScope): {
	engine: SyncEngine;
	uploadQueue: UploadQueue;
} {
	const adapter =
		scope.scopeType === "organization"
			? createDexieOrgSyncAdapter(appDb, scope.scopeId)
			: createDexieSyncAdapter(appDb, scope.scopeId);

	const transport =
		scope.scopeType === "organization"
			? {
					async sync(input: SyncInput): Promise<SyncOutput> {
						const orgInput = {
							changes: input.changes.map((change) => ({
								...change,
								organizationId: change.userId,
								createdBy: null as string | null,
							})),
							lastSyncedAt: input.lastSyncedAt,
						};
						const result = (await client.orgTodo.sync(orgInput)).data;
						return {
							...result,
							serverChanges: result.serverChanges.map((change) => ({
								...change,
								userId: change.organizationId,
							})),
						};
					},
				}
			: {
					async sync(input: SyncInput): Promise<SyncOutput> {
						return (await client.todo.sync(input)).data;
					},
				};

	const engine = new SyncEngine(adapter, transport);
	const uploadTransport = createIndexedDbUploadTransport();
	const uploadQueue = new UploadQueue(uploadAdapter, uploadTransport, {
		lifecycleCallbacks: createTodoUploadLifecycleCallbacks(appDb),
	});

	uploadQueue.onEvent((event) => {
		if (event.type === "upload:complete") {
			engine.sync();
		}
	});

	return { engine, uploadQueue };
}

function teardownAllEngines() {
	for (const { uploadQueue } of engines.values()) {
		uploadQueue.pause();
	}
	engines.clear();
}

function startEnginesForScopes(scopes: SyncScope[]) {
	for (const scope of scopes) {
		const key = scopeKey(scope);
		if (engines.has(key)) continue;

		const entry = createEngine(scope);
		engines.set(key, entry);
		entry.uploadQueue.resume();
		entry.engine.sync();
	}
}

async function loadScopes(): Promise<SyncScope[]> {
	const data = await browser.storage.session.get(SCOPES_STORAGE_KEY);
	return (data[SCOPES_STORAGE_KEY] as SyncScope[] | undefined) ?? [];
}

async function checkStorageHealth() {
	try {
		const estimate = await storageHealthProvider.estimate();
		if (!estimate) return;

		const ratio = estimate.usageRatio;
		if (ratio >= STORAGE_WARNING_RATIO || ratio >= STORAGE_CRITICAL_RATIO) {
			await cleanupUploaded({
				uploadAdapter,
				removeFile: removeFileFromIndexedDB,
			});
		}
	} catch (err) {
		console.error("[background] storage health check failed:", err);
	}
}

async function ensureEnginesFromStorage() {
	const scopes = await loadScopes();
	if (scopes.length === 0) {
		// Fallback: try fetching userId for personal scope
		const userId = await fetchUserId();
		if (userId) {
			startEnginesForScopes([{ scopeType: "personal", scopeId: userId }]);
		}
		return;
	}
	startEnginesForScopes(scopes);
}

// --- Entry Point ---

export default defineBackground(() => {
	if (import.meta.env.DEV) {
		console.log("Background service worker started", {
			id: browser.runtime.id,
		});
	}

	// Popup lifecycle via port
	browser.runtime.onConnect.addListener((port) => {
		if (port.name !== "popup-sync") return;

		popupAlive = true;
		teardownAllEngines();

		port.onMessage.addListener((msg: { scopes?: SyncScope[] }) => {
			if (msg.scopes) {
				browser.storage.session.set({ [SCOPES_STORAGE_KEY]: msg.scopes });
			}
		});

		port.onDisconnect.addListener(() => {
			popupAlive = false;
			ensureEnginesFromStorage().catch((err) =>
				console.error(
					"[background] failed to start engines on popup close:",
					err,
				),
			);
		});
	});

	// Periodic sync alarm
	browser.alarms.create(SYNC_ALARM_NAME, {
		periodInMinutes: SYNC_INTERVAL_MINUTES,
	});

	browser.alarms.onAlarm.addListener(async (alarm) => {
		if (alarm.name !== SYNC_ALARM_NAME) return;
		if (popupAlive) return; // popup handles sync

		if (isOnline) {
			await ensureEnginesFromStorage();
			for (const { engine } of engines.values()) {
				engine.sync();
			}
		}
		await checkStorageHealth();
	});

	// Online/offline
	self.addEventListener("online", () => {
		isOnline = true;
		if (popupAlive) return;
		for (const { engine, uploadQueue } of engines.values()) {
			engine.sync();
			uploadQueue.resume();
		}
	});

	self.addEventListener("offline", () => {
		isOnline = false;
		if (popupAlive) return;
		for (const { uploadQueue } of engines.values()) {
			uploadQueue.pause();
		}
	});

	// Initial setup — only start engines if popup isn't already open
	if (!popupAlive) {
		ensureEnginesFromStorage().catch((err) =>
			console.error("[background] initBackground failed:", err),
		);
	}
});
