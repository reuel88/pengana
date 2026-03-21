import { env } from "@pengana/env/web";
import type { SyncDescriptor } from "@pengana/sync-runtime";
import { descriptorKey } from "@pengana/sync-runtime";
import {
	createOrgTodoEntryConfig,
	createPersonalTodoEntryConfig,
} from "@/features/sync/sync-runtime-config";
import { syncRuntime } from "@/features/sync/sync-runtime-instance";
import type { SyncScope } from "@/shared/api/background-messages";
import { sessionResponseSchema } from "@/shared/api/session-schema";
import { isSyncScope, mergeScopes } from "@/shared/lib/sync-scope-helpers";

// --- Constants ---

const SYNC_ALARM_NAME = "periodic-sync";
const SYNC_INTERVAL_MINUTES = 0.5; // 30 seconds
const SCOPES_STORAGE_KEY = "sync-scopes";

// --- Helpers ---

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

function scopeToDescriptor(scope: SyncScope): SyncDescriptor {
	return {
		scopeType: scope.scopeType,
		scopeId: scope.scopeId,
		entityKey: "todo",
	};
}

function getEntryConfig(scope: SyncScope) {
	if (scope.scopeType === "organization") {
		return createOrgTodoEntryConfig(scope.scopeId);
	}
	return createPersonalTodoEntryConfig(scope.scopeId);
}

async function loadScopes(): Promise<SyncScope[]> {
	const data = await browser.storage.local.get(SCOPES_STORAGE_KEY);
	const stored = data[SCOPES_STORAGE_KEY];
	if (!Array.isArray(stored)) return [];
	return stored.filter(isSyncScope);
}

/** Track which descriptors we've ensured so we can diff on scope changes */
const activeDescriptorKeys = new Set<string>();

async function ensureEntriesFromStorage() {
	const userId = await fetchUserId();

	if (!userId) {
		await browser.storage.local.remove(SCOPES_STORAGE_KEY);
		await syncRuntime.shutdownAll();
		activeDescriptorKeys.clear();
		return;
	}

	const persistedScopes = await loadScopes();

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

	if (scopes.length !== persistedScopes.length || !hasCurrentPersonal) {
		await browser.storage.local.set({ [SCOPES_STORAGE_KEY]: scopes });
	}

	// Determine next set of descriptors
	const nextKeys = new Set<string>();
	for (const scope of scopes) {
		const descriptor = scopeToDescriptor(scope);
		const key = descriptorKey(descriptor);
		nextKeys.add(key);
		if (!syncRuntime.has(descriptor)) {
			syncRuntime.ensure(descriptor, getEntryConfig(scope));
		}
	}

	// Release entries no longer in scope
	for (const key of activeDescriptorKeys) {
		if (!nextKeys.has(key)) {
			const [scopeType, scopeId, entityKey] = key.split(":");
			void syncRuntime.release({
				scopeType: scopeType as "personal" | "organization",
				scopeId,
				entityKey,
			});
		}
	}

	activeDescriptorKeys.clear();
	for (const k of nextKeys) activeDescriptorKeys.add(k);
}

// --- Entry Point ---

export default defineBackground(() => {
	if (import.meta.env.DEV) {
		console.log("Background service worker started", {
			id: browser.runtime.id,
		});
	}

	// Popup lifecycle via port — background ALWAYS owns engines now.
	// The popup only sends scope updates; it does not own sync.
	browser.runtime.onConnect.addListener((port) => {
		if (port.name !== "popup-sync") return;

		port.onMessage.addListener((msg: { scopes?: SyncScope[] }) => {
			if (msg.scopes) {
				const validScopes = msg.scopes.filter(isSyncScope);
				browser.storage.local
					.set({ [SCOPES_STORAGE_KEY]: validScopes })
					.then(() => ensureEntriesFromStorage())
					.then(() => syncRuntime.triggerSyncAll())
					.catch((err) =>
						console.error("[background] failed to update sync scopes:", err),
					);
			}
		});

		// No teardown on popup connect — engines keep running
		// No special action on disconnect — engines keep running
	});

	// Handle messages from popup
	browser.runtime.onMessage.addListener(
		(
			msg: {
				type?: string;
				descriptor?: SyncDescriptor;
				params?: import("@pengana/upload-queue").EnqueueUploadParams;
			},
			_sender,
			_sendResponse,
		) => {
			if (msg?.type === "trigger-sync") {
				syncRuntime.triggerSyncAll();
			}
			if (msg?.type === "enqueue-upload" && msg.descriptor && msg.params) {
				syncRuntime.enqueueUpload(msg.descriptor, msg.params);
			}
		},
	);

	// Periodic sync alarm
	browser.alarms.create(SYNC_ALARM_NAME, {
		periodInMinutes: SYNC_INTERVAL_MINUTES,
	});

	browser.alarms.onAlarm.addListener(async (alarm) => {
		if (alarm.name !== SYNC_ALARM_NAME) return;

		await ensureEntriesFromStorage();
		syncRuntime.triggerSyncAll();
	});

	// Initial setup
	ensureEntriesFromStorage().catch((err) =>
		console.error("[background] initBackground failed:", err),
	);
});
