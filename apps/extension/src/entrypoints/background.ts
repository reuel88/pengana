import { env } from "@pengana/env/web";
import { createSyncTransport } from "@pengana/sync-client";
import {
	cleanupUploaded,
	STORAGE_WARNING_RATIO,
	SyncEngine,
	UploadQueue,
} from "@pengana/sync-engine";
import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";
import {
	createUploadLifecycleCallbacks,
	createWebUploadAdapter,
	reconcileMedia,
} from "@pengana/upload-client";
import { removeFileFromIndexedDB } from "@pengana/upload-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/upload-client/lib/storage-health";
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
let teardownPromise: Promise<void> | null = null;

const storageHealthProvider = createWebStorageHealthProvider();
const uploadAdapter = createWebUploadAdapter(appDb);

// --- Helpers ---

function scopeKey(scope: SyncScope): string {
	return `${scope.scopeType}:${scope.scopeId}`;
}

function isSyncScope(value: unknown): value is SyncScope {
	if (!value || typeof value !== "object") return false;

	const scope = value as Partial<SyncScope>;
	return (
		(scope.scopeType === "personal" || scope.scopeType === "organization") &&
		typeof scope.scopeId === "string" &&
		scope.scopeId.length > 0
	);
}

function mergeScopes(...groups: SyncScope[][]): SyncScope[] {
	const merged = new Map<string, SyncScope>();
	for (const scopes of groups) {
		for (const scope of scopes) {
			merged.set(scopeKey(scope), scope);
		}
	}
	return [...merged.values()];
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
	const isOrg = scope.scopeType === "organization";
	const config = isOrg ? orgTodoConfig : personalTodoConfig;
	const adapter = createTodoSyncAdapter(appDb, scope.scopeId, config);

	const onMedia = (
		media: import("@pengana/sync-engine").Media[],
		entityIds: string[],
	) => reconcileMedia(appDb, media, entityIds);

	const transport = isOrg
		? createSyncTransport(async (input) => {
				return (await client.orgTodo.sync(input, { signal: input.signal }))
					.data;
			}, onMedia)
		: createSyncTransport(async (input) => {
				return (await client.todo.sync(input, { signal: input.signal })).data;
			}, onMedia);

	const engine = new SyncEngine(adapter, transport);
	const uploadTransport = createIndexedDbUploadTransport();
	const uploadQueue = new UploadQueue(uploadAdapter, uploadTransport, {
		lifecycleCallbacks: createUploadLifecycleCallbacks(appDb),
	});

	uploadQueue.onEvent((event) => {
		if (event.type === "upload:complete") {
			engine.sync();
		}
	});

	return { engine, uploadQueue };
}

async function teardownAllEngines() {
	if (teardownPromise) {
		return teardownPromise;
	}

	const entries = Array.from(engines.values());
	teardownPromise = (async () => {
		for (const { uploadQueue } of entries) {
			uploadQueue.pause();
		}
		await Promise.all(entries.map(({ engine }) => engine.shutdown()));
		engines.clear();
	})().finally(() => {
		teardownPromise = null;
	});

	return teardownPromise;
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
	const data = await browser.storage.local.get(SCOPES_STORAGE_KEY);
	const stored = data[SCOPES_STORAGE_KEY];
	if (!Array.isArray(stored)) return [];

	return stored.filter(isSyncScope);
}

async function checkStorageHealth() {
	try {
		const estimate = await storageHealthProvider.estimate();
		if (!estimate) return;

		const ratio = estimate.usageRatio;
		if (ratio >= STORAGE_WARNING_RATIO) {
			await cleanupUploaded({
				uploadAdapter,
				removeFile: (entityId: string) =>
					removeFileFromIndexedDB(appDb, entityId),
			});
		}
	} catch (err) {
		console.error("[background] storage health check failed:", err);
	}
}

async function ensureEnginesFromStorage() {
	if (teardownPromise) {
		await teardownPromise;
	}

	const userId = await fetchUserId();

	// No session — clear stale scopes and stop
	if (!userId) {
		await browser.storage.local.remove(SCOPES_STORAGE_KEY);
		if (engines.size > 0) {
			await teardownAllEngines();
		}
		return;
	}

	const persistedScopes = await loadScopes();

	// Replace any stale personal scopes with the current user's
	const validatedScopes = persistedScopes.filter(
		(s) => s.scopeType !== "personal" || s.scopeId === userId,
	);
	const hasCurrentPersonal = validatedScopes.some(
		(s) => s.scopeType === "personal",
	);
	const fallbackScopes: SyncScope[] = hasCurrentPersonal
		? []
		: [{ scopeType: "personal", scopeId: userId }];
	const scopes = mergeScopes(validatedScopes, fallbackScopes);

	// Persist validated scopes back
	if (scopes.length !== persistedScopes.length || !hasCurrentPersonal) {
		await browser.storage.local.set({ [SCOPES_STORAGE_KEY]: scopes });
	}

	if (scopes.length === 0) return;

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
		void teardownAllEngines().catch((err) =>
			console.error("[background] failed to tear down engines:", err),
		);

		port.onMessage.addListener((msg: { scopes?: SyncScope[] }) => {
			if (msg.scopes) {
				browser.storage.local
					.set({ [SCOPES_STORAGE_KEY]: msg.scopes.filter(isSyncScope) })
					.catch((err) =>
						console.error("[background] failed to persist sync scopes:", err),
					);
			}
		});

		port.onDisconnect.addListener(() => {
			popupAlive = false;
			void Promise.resolve(teardownPromise)
				.then(() => ensureEnginesFromStorage())
				.catch((err) =>
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
