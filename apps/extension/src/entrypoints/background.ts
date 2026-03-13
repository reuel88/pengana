import { env } from "@pengana/env/web";
import type {
	StorageLevel,
	SyncEvent,
	SyncInput,
	SyncOutput,
	UploadEvent,
} from "@pengana/sync-engine";
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
	createWebUploadAdapter,
	removeFileFromIndexedDB,
} from "@pengana/todo-client";
import { createWebStorageHealthProvider } from "@pengana/todo-client/lib/storage-health";
import { createIndexedDbUploadTransport } from "@/features/sync/entities/upload-queue";
import type {
	BackgroundBroadcast,
	BackgroundMessage,
	SyncScope,
	SyncScopeType,
	SyncStatus,
} from "@/shared/api/background-messages";
import { isSyncActive, isUploadActive } from "@/shared/api/background-messages";
import { client } from "@/shared/api/orpc";
import { sessionResponseSchema } from "@/shared/api/session-schema";

// --- Constants ---

const SYNC_ALARM_NAME = "periodic-sync";
const SYNC_INTERVAL_SECONDS = 30;
const SYNC_INTERVAL_MINUTES = SYNC_INTERVAL_SECONDS / 60;

// --- State ---

interface BackgroundState {
	isOnline: boolean;
	scopes: Map<string, ScopeState>;
}

interface ScopeState {
	engine: SyncEngine | null;
	uploadQueue: UploadQueue | null;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
	scopeType: SyncScopeType;
	scopeId: string;
}

// Mutable singleton — async interleaving is safe because all mutations are
// idempotent (setupEngine checks userId equality) or last-write-wins (boolean
// flags overwritten by the next event). No torn state is possible.
const state: BackgroundState = {
	isOnline: true,
	scopes: new Map(),
};

// --- Utilities ---

function toScopeKey(scope: SyncScope) {
	return `${scope.scopeType}:${scope.scopeId}`;
}

function getOrCreateScopeState(scope: SyncScope): ScopeState {
	const key = toScopeKey(scope);
	const existing = state.scopes.get(key);
	if (existing) return existing;

	const created: ScopeState = {
		engine: null,
		uploadQueue: null,
		isSyncing: false,
		isUploading: false,
		storageLevel: "ok",
		scopeType: scope.scopeType,
		scopeId: scope.scopeId,
	};
	state.scopes.set(key, created);
	return created;
}

function getStatus(scope: SyncScope): SyncStatus {
	const scopeState = getOrCreateScopeState(scope);
	return {
		scopeType: scope.scopeType,
		scopeId: scope.scopeId,
		isOnline: state.isOnline,
		isSyncing: scopeState.isSyncing,
		isUploading: scopeState.isUploading,
		storageLevel: scopeState.storageLevel,
	};
}

const storageHealthProvider = createWebStorageHealthProvider();
const uploadAdapter = createWebUploadAdapter();

async function checkStorageHealth(scope: SyncScope): Promise<void> {
	const scopeState = getOrCreateScopeState(scope);
	try {
		const estimate = await storageHealthProvider.estimate();
		if (!estimate) return;

		let level: StorageLevel = "ok";
		if (estimate.usageRatio >= STORAGE_CRITICAL_RATIO) {
			level = "critical";
		} else if (estimate.usageRatio >= STORAGE_WARNING_RATIO) {
			level = "warning";
		}

		if (level === "warning" || level === "critical") {
			await cleanupUploaded({
				uploadAdapter,
				removeFile: removeFileFromIndexedDB,
			});
		}

		const previousLevel = scopeState.storageLevel;
		scopeState.storageLevel = level;
		if (level !== previousLevel) {
			broadcast({ type: "status:update", status: getStatus(scope) });
		}
	} catch (err) {
		console.error("[background] storage health check failed:", err);
	}
}

function broadcast(message: BackgroundBroadcast) {
	browser.runtime.sendMessage(message).catch(() => {
		// Popup not open — ignore
	});
}

async function fetchUserId(): Promise<string | null> {
	try {
		const res = await fetch(`${env.VITE_SERVER_URL}/api/auth/get-session`, {
			credentials: "include",
		});
		if (!res.ok) return null;
		const parsed = sessionResponseSchema.safeParse(await res.json());
		if (!parsed.success) return null;
		// Better Auth returns session.userId for cookie sessions, user.id for token responses
		return parsed.data.session?.userId ?? parsed.data.user?.id ?? null;
	} catch {
		return null;
	}
}

// --- Engine Lifecycle ---

function createSyncEngine(scope: SyncScope): SyncEngine {
	const adapter =
		scope.scopeType === "organization"
			? createDexieOrgSyncAdapter(scope.scopeId)
			: createDexieSyncAdapter(scope.scopeId);
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
	const scopeState = getOrCreateScopeState(scope);

	engine.onEvent((event: SyncEvent) => {
		const active = isSyncActive(event);
		if (active !== null) scopeState.isSyncing = active;
		broadcast({ type: "sync:event", event, ...scope });
	});

	return engine;
}

function createUploadQueueForEngine(
	engine: SyncEngine,
	scope: SyncScope,
): UploadQueue {
	const uploadTransport = createIndexedDbUploadTransport();
	const queue = new UploadQueue(uploadAdapter, uploadTransport);
	const scopeState = getOrCreateScopeState(scope);

	queue.onEvent((event: UploadEvent) => {
		const active = isUploadActive(event);
		if (active !== null) scopeState.isUploading = active;
		if (event.type === "upload:complete") {
			engine.sync();
		}
		broadcast({ type: "upload:event", event, ...scope });
	});

	return queue;
}

function teardownEngine(scope: SyncScope) {
	const scopeState = getOrCreateScopeState(scope);
	scopeState.uploadQueue?.pause();
	scopeState.engine = null;
	scopeState.uploadQueue = null;
}

function setupEngine(scope: SyncScope) {
	const scopeState = getOrCreateScopeState(scope);
	if (scopeState.engine) return;

	teardownEngine(scope);

	scopeState.engine = createSyncEngine(scope);
	scopeState.uploadQueue = createUploadQueueForEngine(scopeState.engine, scope);

	scopeState.uploadQueue.resume();
	scopeState.engine.sync();
}

/** Fetches the current userId (if needed) and initializes the sync engine. */
async function ensureEngine(scope: SyncScope): Promise<void> {
	const scopeState = getOrCreateScopeState(scope);
	if (scopeState.engine) return;
	if (scope.scopeType === "organization") {
		setupEngine(scope);
		return;
	}
	const userId = scope.scopeId || (await fetchUserId());
	if (userId) setupEngine({ scopeType: "personal", scopeId: userId });
}

// --- Message Handler ---

/**
 * Handles messages from the popup/content scripts.
 *
 * Returns `true` when the response will be sent asynchronously (keeps the
 * Chrome messaging channel open), `false` when the response is sent
 * synchronously before this function returns.
 */
function handleMessage(
	message: BackgroundMessage,
	sendResponse: (response: unknown) => void,
): boolean {
	switch (message.type) {
		case "init": {
			setupEngine(message);
			sendResponse({ ok: true });
			return false; // sync
		}

		case "sync:trigger": {
			if (state.isOnline) {
				ensureEngine(message)
					.then(() => getOrCreateScopeState(message).engine?.sync())
					.catch((err) =>
						console.error("[background] sync:trigger failed:", err),
					);
			}
			sendResponse({ ok: true });
			return false; // sync
		}

		case "upload:enqueue": {
			const scopeState = getOrCreateScopeState(message);
			if (scopeState.uploadQueue) {
				scopeState.uploadQueue.enqueue({
					id: crypto.randomUUID(),
					todoId: message.payload.todoId,
					fileUri: message.payload.fileUri,
					mimeType: message.payload.mimeType,
				});
				sendResponse({ ok: true });
			} else {
				console.warn("[background] upload:enqueue dropped — queue not ready");
				sendResponse({ ok: false, error: "Upload queue not ready" });
			}
			return false; // sync
		}

		case "status:get": {
			const scopeState = getOrCreateScopeState(message);
			if (!scopeState.engine) {
				ensureEngine(message)
					.then(() => checkStorageHealth(message))
					.then(() => sendResponse(getStatus(message)))
					.catch(() => sendResponse(getStatus(message)));
				return true; // async — keep channel open
			}
			sendResponse(getStatus(message));
			return false; // sync
		}

		default: {
			sendResponse({ ok: false, error: "Unknown message type" });
			return false; // sync
		}
	}
}

// --- Entry Point ---
// Console convention: console.error/warn are always-on for production
// diagnostics; console.log is guarded by import.meta.env.DEV.

async function initBackground() {
	const userId = await fetchUserId();
	if (userId) {
		setupEngine({ scopeType: "personal", scopeId: userId });
	}

	if (userId) {
		await checkStorageHealth({ scopeType: "personal", scopeId: userId });
	}

	await browser.alarms.create(SYNC_ALARM_NAME, {
		periodInMinutes: SYNC_INTERVAL_MINUTES,
	});
}

export default defineBackground(() => {
	if (import.meta.env.DEV) {
		console.log("Background service worker started", {
			id: browser.runtime.id,
		});
	}

	browser.alarms.onAlarm.addListener(async (alarm) => {
		if (alarm.name === SYNC_ALARM_NAME) {
			for (const scopeState of state.scopes.values()) {
				const scope = {
					scopeType: scopeState.scopeType,
					scopeId: scopeState.scopeId,
				} as const;
				if (state.isOnline) {
					await ensureEngine(scope);
					scopeState.engine?.sync();
				}
				await checkStorageHealth(scope);
			}
		}
	});

	browser.runtime.onMessage.addListener(
		(message: BackgroundMessage, sender, sendResponse) => {
			if (sender.id !== browser.runtime.id) {
				sendResponse({ ok: false, error: "Unauthorized sender" });
				return false;
			}
			return handleMessage(message, sendResponse);
		},
	);

	self.addEventListener("online", () => {
		state.isOnline = true;
		for (const scopeState of state.scopes.values()) {
			scopeState.engine?.sync();
			scopeState.uploadQueue?.resume();
			broadcast({
				type: "status:update",
				status: getStatus({
					scopeType: scopeState.scopeType,
					scopeId: scopeState.scopeId,
				}),
			});
		}
	});

	self.addEventListener("offline", () => {
		state.isOnline = false;
		for (const scopeState of state.scopes.values()) {
			scopeState.uploadQueue?.pause();
			broadcast({
				type: "status:update",
				status: getStatus({
					scopeType: scopeState.scopeType,
					scopeId: scopeState.scopeId,
				}),
			});
		}
	});

	initBackground().catch((err) =>
		console.error("[background] initBackground failed:", err),
	);
});
