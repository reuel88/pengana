import { env } from "@pengana/env/web";
import type {
	SyncEvent,
	SyncInput,
	SyncOutput,
	UploadEvent,
} from "@pengana/sync-engine";
import { SyncEngine, UploadQueue } from "@pengana/sync-engine";
import {
	createDexieSyncAdapter,
	createWebUploadAdapter,
} from "@pengana/todo-client";
import { createIndexedDbUploadTransport } from "@/entities/upload-queue";
import type {
	BackgroundBroadcast,
	BackgroundMessage,
	SyncStatus,
} from "@/utils/background-messages";
import { isSyncActive, isUploadActive } from "@/utils/background-messages";
import { client } from "@/utils/orpc";
import { sessionResponseSchema } from "@/utils/session-schema";

// --- Constants ---

const SYNC_ALARM_NAME = "periodic-sync";
const SYNC_INTERVAL_SECONDS = 30;
const SYNC_INTERVAL_MINUTES = SYNC_INTERVAL_SECONDS / 60;

// --- State ---

interface BackgroundState {
	engine: SyncEngine | null;
	uploadQueue: UploadQueue | null;
	currentUserId: string | null;
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
}

// Mutable singleton — async interleaving is safe because all mutations are
// idempotent (setupEngine checks userId equality) or last-write-wins (boolean
// flags overwritten by the next event). No torn state is possible.
const state: BackgroundState = {
	engine: null,
	uploadQueue: null,
	currentUserId: null,
	isOnline: true,
	isSyncing: false,
	isUploading: false,
};

// --- Utilities ---

function getStatus(): SyncStatus {
	return {
		isOnline: state.isOnline,
		isSyncing: state.isSyncing,
		isUploading: state.isUploading,
		userId: state.currentUserId,
	};
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

function createSyncEngine(userId: string): SyncEngine {
	const adapter = createDexieSyncAdapter(userId);
	const transport = {
		async sync(input: SyncInput): Promise<SyncOutput> {
			return (await client.todo.sync(input)).data;
		},
	};

	const engine = new SyncEngine(adapter, transport);

	engine.onEvent((event: SyncEvent) => {
		const active = isSyncActive(event);
		if (active !== null) state.isSyncing = active;
		broadcast({ type: "sync:event", event });
	});

	return engine;
}

function createUploadQueueForEngine(engine: SyncEngine): UploadQueue {
	const uploadAdapter = createWebUploadAdapter();
	const uploadTransport = createIndexedDbUploadTransport();
	const queue = new UploadQueue(uploadAdapter, uploadTransport);

	queue.onEvent((event: UploadEvent) => {
		const active = isUploadActive(event);
		if (active !== null) state.isUploading = active;
		if (event.type === "upload:complete") {
			engine.sync();
		}
		broadcast({ type: "upload:event", event });
	});

	return queue;
}

function teardownEngine() {
	if (state.uploadQueue) {
		state.uploadQueue.pause();
	}
	state.engine = null;
	state.uploadQueue = null;
}

function setupEngine(userId: string) {
	if (state.engine && state.currentUserId === userId) return;

	teardownEngine();
	state.currentUserId = userId;

	state.engine = createSyncEngine(userId);
	state.uploadQueue = createUploadQueueForEngine(state.engine);

	state.uploadQueue.resume();
	state.engine.sync();
}

/** Fetches the current userId (if needed) and initializes the sync engine. */
async function ensureEngine(): Promise<void> {
	if (state.engine) return;
	const userId = state.currentUserId ?? (await fetchUserId());
	if (userId) setupEngine(userId);
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
			setupEngine(message.userId);
			sendResponse({ ok: true });
			return false; // sync
		}

		case "sync:trigger": {
			if (state.isOnline) {
				ensureEngine()
					.then(() => state.engine?.sync())
					.catch((err) =>
						console.error("[background] sync:trigger failed:", err),
					);
			}
			sendResponse({ ok: true });
			return false; // sync
		}

		case "upload:enqueue": {
			if (state.uploadQueue) {
				state.uploadQueue.enqueue({
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
			if (!state.currentUserId || !state.engine) {
				ensureEngine()
					.then(() => sendResponse(getStatus()))
					.catch(() => sendResponse(getStatus()));
				return true; // async — keep channel open
			}
			sendResponse(getStatus());
			return false; // sync
		}

		default: {
			sendResponse({ ok: false, error: "Unknown message type" });
			return false; // sync
		}
	}
}

// --- Entry Point ---

async function initBackground() {
	const userId = await fetchUserId();
	if (userId) {
		setupEngine(userId);
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
		if (alarm.name === SYNC_ALARM_NAME && state.isOnline) {
			await ensureEngine();
			state.engine?.sync();
		}
	});

	browser.runtime.onMessage.addListener(
		(message: BackgroundMessage, _sender, sendResponse) => {
			return handleMessage(message, sendResponse);
		},
	);

	self.addEventListener("online", () => {
		state.isOnline = true;
		state.engine?.sync();
		state.uploadQueue?.resume();
		broadcast({ type: "status:update", status: getStatus() });
	});

	self.addEventListener("offline", () => {
		state.isOnline = false;
		state.uploadQueue?.pause();
		broadcast({ type: "status:update", status: getStatus() });
	});

	initBackground().catch((err) =>
		console.error("[background] initBackground failed:", err),
	);
});
