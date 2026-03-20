import { useNetworkStatus } from "@pengana/realtime-transport";
import type { StorageLevel } from "@pengana/storage-health";
import { useStorageHealth } from "@pengana/storage-health";
import { createSyncTransport } from "@pengana/sync-client";
import type { SyncEvent } from "@pengana/sync-engine";
import {
	MAX_EVENT_LOG_SIZE,
	SyncEngine,
	usePeriodicSync,
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
import type { UploadEvent } from "@pengana/upload-queue";
import { cleanupUploaded, useUploadQueue } from "@pengana/upload-queue";
import type { ReactNode } from "react";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createIndexedDbUploadTransport } from "./entities/upload-queue";

// --- Context types ---

interface SyncContextValue {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
	triggerSync: () => void;
	enqueueUpload: (
		fileUri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void;
}

interface SyncDevtoolsValue {
	events: SyncEvent[];
	uploadEvents: UploadEvent[];
	simulateOffline: boolean;
	setSimulateOffline: (value: boolean) => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);
const SyncDevtoolsContext = createContext<SyncDevtoolsValue | null>(null);

export function useSync(): SyncContextValue {
	const context = use(SyncContext);
	if (!context) {
		throw new Error("useSync must be used within a SyncProvider");
	}
	return context;
}

export { useSync as useOrgSync };

export function useSyncDevtools(): SyncDevtoolsValue {
	const context = use(SyncDevtoolsContext);
	if (!context) {
		throw new Error("useSyncDevtools must be used within a SyncProvider");
	}
	return context;
}

export { useSyncDevtools as useOrgSyncDevtools };

// --- Shared deps ---

const storageHealthProvider = createWebStorageHealthProvider();
const uploadLifecycleCallbacks = createUploadLifecycleCallbacks(appDb);

function useComposedSyncEngine(options: {
	scopeId: string;
	isOnline: boolean;
	createSyncAdapter: (id: string) => ReturnType<typeof createTodoSyncAdapter>;
	createSyncTransport: () => ReturnType<typeof createSyncTransport>;
}) {
	const {
		scopeId,
		isOnline,
		createSyncAdapter,
		createSyncTransport: createTransport,
	} = options;

	const engineRef = useRef<SyncEngine | null>(null);
	const [events, setEvents] = useState<SyncEvent[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const [simulateOffline, setSimulateOffline] = useState(false);
	const effectiveOnline = isOnline && !simulateOffline;

	// --- Engine Init ---
	useEffect(() => {
		const adapter = createSyncAdapter(scopeId);
		const transport = createTransport();
		const engine = new SyncEngine(adapter, transport);
		engineRef.current = engine;

		const unsubscribe = engine.onEvent((event) => {
			setEvents((prev) => [...prev.slice(-(MAX_EVENT_LOG_SIZE - 1)), event]);
			if (event.type === "sync:start") setIsSyncing(true);
			if (event.type === "sync:complete" || event.type === "sync:error")
				setIsSyncing(false);
		});

		return () => {
			unsubscribe();
			void engine.shutdown();
			engineRef.current = null;
		};
	}, [scopeId, createSyncAdapter, createTransport]);

	// --- Upload Queue ---
	const { isUploading, uploadEvents, enqueueUpload } = useUploadQueue(
		scopeId,
		effectiveOnline,
		{
			createUploadAdapter: () => createWebUploadAdapter(appDb),
			createUploadTransport: createIndexedDbUploadTransport,
			lifecycleCallbacks: uploadLifecycleCallbacks,
			onUploadComplete: () => engineRef.current?.sync(),
		},
	);

	// --- Storage Health ---
	const uploadAdapter = useMemo(() => createWebUploadAdapter(appDb), []);

	const onStorageWarning = useCallback(async () => {
		await cleanupUploaded({
			uploadAdapter,
			removeFile: (entityId: string) =>
				removeFileFromIndexedDB(appDb, entityId),
		});
	}, [uploadAdapter]);

	const { storageLevel } = useStorageHealth({
		provider: storageHealthProvider,
		onStorageWarning,
	});

	// --- Online Reactivity ---
	useEffect(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	// --- Periodic Sync ---
	usePeriodicSync(effectiveOnline, engineRef);

	// --- No realtime for extension (uses background alarms) ---

	// --- Focus Subscription ---
	useEffect(() => {
		if (!effectiveOnline) return;
		const handler = () => {
			if (document.visibilityState === "visible") engineRef.current?.sync();
		};
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	}, [effectiveOnline]);

	// --- Public API ---
	const triggerSync = useCallback(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	return {
		core: {
			isOnline: effectiveOnline,
			isSyncing,
			isUploading,
			storageLevel,
			triggerSync,
			enqueueUpload,
		},
		devtools: {
			events,
			uploadEvents,
			simulateOffline,
			setSimulateOffline,
		},
	};
}

// --- Providers ---

export function SyncProvider({
	userId,
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: ReactNode;
}) {
	const createSyncAdapter = useCallback(
		(uid: string) =>
			createTodoSyncAdapter(appDb, uid, personalTodoConfig, {
				filter: (todo) => todo.organizationId === organizationId,
				syncKeySuffix: organizationId,
			}),
		[organizationId],
	);

	const createTransport = useCallback(
		() =>
			createSyncTransport(
				async (input) =>
					(await client.todo.sync(input, { signal: input.signal })).data,
				(media, attachments, entityIds) =>
					reconcileMedia(appDb, media, attachments, entityIds),
			),
		[],
	);

	const { isOnline } = useNetworkStatus();

	const { core, devtools } = useComposedSyncEngine({
		scopeId: userId,
		isOnline,
		createSyncAdapter,
		createSyncTransport: createTransport,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

export function OrgSyncProvider({
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: ReactNode;
}) {
	const createSyncAdapter = useCallback(
		(orgId: string) => createTodoSyncAdapter(appDb, orgId, orgTodoConfig),
		[],
	);

	const createTransport = useCallback(
		() =>
			createSyncTransport(
				async (input) => {
					return (await client.orgTodo.sync(input, { signal: input.signal }))
						.data;
				},
				(media, attachments, entityIds) =>
					reconcileMedia(appDb, media, attachments, entityIds),
			),
		[],
	);

	const { isOnline } = useNetworkStatus();

	const { core, devtools } = useComposedSyncEngine({
		scopeId: organizationId,
		isOnline,
		createSyncAdapter,
		createSyncTransport: createTransport,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
