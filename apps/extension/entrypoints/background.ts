import { env } from "@pengana/env/web";
import type {
	SyncEvent,
	SyncInput,
	SyncOutput,
	UploadEvent,
} from "@pengana/sync-engine";
import { SyncEngine, UploadQueue } from "@pengana/sync-engine";

import { createDexieSyncAdapter } from "@/entities/todo";
import {
	createWebUploadAdapter,
	createWebUploadTransport,
} from "@/entities/upload-queue";
import type {
	BackgroundBroadcast,
	BackgroundMessage,
	SyncStatus,
} from "@/utils/background-messages";
import { client } from "@/utils/orpc";

const SYNC_ALARM_NAME = "periodic-sync";
const SYNC_INTERVAL_MINUTES = 0.5; // 30 seconds

interface BackgroundState {
	engine: SyncEngine | null;
	uploadQueue: UploadQueue | null;
	currentUserId: string | null;
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
}

const state: BackgroundState = {
	engine: null,
	uploadQueue: null,
	currentUserId: null,
	isOnline: true,
	isSyncing: false,
	isUploading: false,
};

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
		const data: { session?: { userId?: string }; user?: { id?: string } } =
			await res.json();
		return data?.session?.userId ?? data?.user?.id ?? null;
	} catch {
		return null;
	}
}

function teardownEngine() {
	if (state.uploadQueue) {
		state.uploadQueue.pause();
	}
	state.engine = null;
	state.uploadQueue = null;
}

function createSyncEngine(userId: string): SyncEngine {
	const adapter = createDexieSyncAdapter(userId);
	const transport = {
		async sync(input: SyncInput): Promise<SyncOutput> {
			return client.todo.sync(input);
		},
	};

	const engine = new SyncEngine(adapter, transport);

	engine.onEvent((event: SyncEvent) => {
		if (event.type === "sync:start") state.isSyncing = true;
		if (event.type === "sync:complete" || event.type === "sync:error")
			state.isSyncing = false;
		broadcast({ type: "sync:event", event });
	});

	return engine;
}

function createUploadQueueForEngine(engine: SyncEngine): UploadQueue {
	const uploadAdapter = createWebUploadAdapter();
	const uploadTransport = createWebUploadTransport();
	const queue = new UploadQueue(uploadAdapter, uploadTransport);

	queue.onEvent((event: UploadEvent) => {
		if (event.type === "upload:start") state.isUploading = true;
		if (event.type === "upload:complete" || event.type === "upload:error")
			state.isUploading = false;
		if (event.type === "upload:complete") {
			engine.sync();
		}
		broadcast({ type: "upload:event", event });
	});

	return queue;
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

function handleMessage(
	message: BackgroundMessage,
	sendResponse: (response: unknown) => void,
): boolean {
	switch (message.type) {
		case "init": {
			setupEngine(message.userId);
			sendResponse({ ok: true });
			return false;
		}

		case "sync:trigger": {
			if (state.isOnline) {
				if (!state.engine && state.currentUserId) {
					setupEngine(state.currentUserId);
				}
				state.engine?.sync();
			}
			sendResponse({ ok: true });
			return false;
		}

		case "upload:enqueue": {
			if (state.uploadQueue) {
				state.uploadQueue.enqueue({
					id: crypto.randomUUID(),
					todoId: message.payload.todoId,
					fileUri: message.payload.fileUri,
					mimeType: message.payload.mimeType,
				});
			}
			sendResponse({ ok: true });
			return false;
		}

		case "status:get": {
			if (!state.currentUserId) {
				fetchUserId().then((userId) => {
					if (userId) setupEngine(userId);
					sendResponse(getStatus());
				});
				return true; // Keep message channel open for async response
			}
			sendResponse(getStatus());
			return false;
		}
	}
}

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
	console.log("Background service worker started", { id: browser.runtime.id });

	browser.alarms.onAlarm.addListener(async (alarm) => {
		if (alarm.name === SYNC_ALARM_NAME && state.isOnline) {
			if (!state.engine) {
				const userId = await fetchUserId();
				if (userId) setupEngine(userId);
			}
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

	initBackground();
});
