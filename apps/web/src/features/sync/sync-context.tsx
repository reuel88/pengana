import {
	createNetworkStatusMonitor,
	subscribeToSharedNotifyChannel,
} from "@pengana/realtime-transport";
import type { StorageLevel } from "@pengana/storage-health";
import { StorageHealthMonitor } from "@pengana/storage-health";
import type { SyncEvent } from "@pengana/sync-engine";
import {
	createPeriodicSync,
	createSyncTransport,
	MAX_EVENT_LOG_SIZE,
	SyncEngine,
} from "@pengana/sync-engine";
import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";
import {
	createUploadLifecycleCallbacks,
	createWebUploadAdapter,
	MediaSyncer,
	reconcileMedia,
} from "@pengana/upload-client";
import { removeFileFromDexie } from "@pengana/upload-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/upload-client/lib/storage-health";
import type { EnqueueUploadParams, UploadEvent } from "@pengana/upload-queue";
import { cleanupUploaded, UploadQueueManager } from "@pengana/upload-queue";
import type { ReactNode } from "react";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { createDexieUploadTransport } from "@/features/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createRealtimeTransport, onRefreshNotify } from "./platform-deps";

// --- Network status ---

const networkMonitor = createNetworkStatusMonitor();

// --- Context types (same shape as before — no downstream changes) ---

interface SyncContextValue {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
	triggerSync: () => void;
	enqueueUpload: (params: EnqueueUploadParams) => void;
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
	notifyKey?: string;
	isForeground?: boolean;
	createSyncAdapter: (id: string) => ReturnType<typeof createTodoSyncAdapter>;
	createSyncTransport: () => ReturnType<typeof createSyncTransport>;
	createMediaSyncer?: (scopeId: string) => MediaSyncer;
}) {
	const {
		scopeId,
		isOnline,
		notifyKey = scopeId,
		isForeground = true,
		createSyncAdapter,
		createSyncTransport: createTransport,
		createMediaSyncer,
	} = options;

	// --- State ---
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

		// Trigger initial sync so the engine fetches current server state.
		// The old useSyncEngine did this implicitly via cascading dep changes.
		engine.sync();

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
			setIsSyncing(false);
			setEvents([]);
		};
	}, [scopeId, createSyncAdapter, createTransport]);

	// --- Media Syncer ---
	const mediaSyncerRef = useRef<MediaSyncer | null>(null);

	useEffect(() => {
		if (createMediaSyncer) {
			mediaSyncerRef.current = createMediaSyncer(scopeId);
			mediaSyncerRef.current.sync();
		}
		return () => {
			mediaSyncerRef.current = null;
		};
	}, [scopeId, createMediaSyncer]);

	const triggerAllSyncs = useCallback(() => {
		engineRef.current?.sync();
		mediaSyncerRef.current?.sync();
	}, []);

	// --- Upload Queue ---
	const managerRef = useRef(
		new UploadQueueManager({
			createUploadAdapter: () => createWebUploadAdapter(appDb),
			createUploadTransport: createDexieUploadTransport,
			lifecycleCallbacks: uploadLifecycleCallbacks,
			onSettled: () => triggerAllSyncs(),
		}),
	);

	useEffect(() => {
		managerRef.current.init(scopeId);
		return () => managerRef.current.dispose();
	}, [scopeId]);

	useEffect(() => {
		managerRef.current.setOnline(effectiveOnline);
	}, [effectiveOnline]);

	const { isUploading, uploadEvents } = useSyncExternalStore(
		(cb) => managerRef.current.subscribe(cb),
		() => managerRef.current.getState(),
	);

	const enqueueUpload = useCallback(
		(params: EnqueueUploadParams) => managerRef.current.enqueue(params),
		[],
	);

	// --- Storage Health ---
	const uploadAdapter = useMemo(() => createWebUploadAdapter(appDb), []);

	const onStorageWarning = useCallback(async () => {
		await cleanupUploaded({
			uploadAdapter,
			removeFile: (item) => removeFileFromDexie(appDb, item.id),
		});
	}, [uploadAdapter]);

	const storageMonitorRef = useRef<StorageHealthMonitor | null>(null);
	if (storageMonitorRef.current === null) {
		storageMonitorRef.current = new StorageHealthMonitor({
			provider: storageHealthProvider,
			onStorageWarning,
		});
	}

	const storageLevel = useSyncExternalStore(
		storageMonitorRef.current.subscribe,
		storageMonitorRef.current.getLevel,
	);

	useEffect(() => {
		const monitor = storageMonitorRef.current;
		if (!monitor) return;
		monitor.start();
		return () => monitor.stop();
	}, []);

	// --- Online Reactivity ---
	// Engine Init already triggers sync on mount/re-init, so skip the
	// first fire of this effect to avoid a redundant server round-trip.
	const didMountRef = useRef(false);
	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true;
			return;
		}
		if (effectiveOnline) {
			triggerAllSyncs();
		}
	}, [effectiveOnline, triggerAllSyncs]);

	// --- Periodic Sync ---
	const periodicSyncRef = useRef(createPeriodicSync(() => engineRef.current));

	useEffect(() => {
		const ps = periodicSyncRef.current;
		if (effectiveOnline) {
			ps.start();
		} else {
			ps.stop();
		}
		return () => ps.stop();
	}, [effectiveOnline]);

	// --- Realtime Transport ---
	const realtimeSubRef = useRef<ReturnType<
		typeof subscribeToSharedNotifyChannel
	> | null>(null);

	useEffect(() => {
		if (!notifyKey) {
			realtimeSubRef.current?.unsubscribe();
			realtimeSubRef.current = null;
			return;
		}

		const subscription = subscribeToSharedNotifyChannel({
			notifyKey,
			createNotifyTransport: createRealtimeTransport,
			enabled: true,
			onNotify: (kind) => {
				if (kind === "sync") {
					triggerAllSyncs();
					return;
				}
				onRefreshNotify();
			},
			onOpen: () => {
				triggerAllSyncs();
			},
		});

		realtimeSubRef.current = subscription;
		return () => {
			subscription.unsubscribe();
			if (realtimeSubRef.current === subscription) {
				realtimeSubRef.current = null;
			}
		};
	}, [notifyKey, triggerAllSyncs]);

	useEffect(() => {
		realtimeSubRef.current?.setEnabled(effectiveOnline && isForeground);
	}, [effectiveOnline, isForeground]);

	// --- Focus Subscription ---
	useEffect(() => {
		if (!effectiveOnline) return;
		const handler = () => {
			if (document.visibilityState === "visible") triggerAllSyncs();
		};
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	}, [effectiveOnline, triggerAllSyncs]);

	// --- Public API ---
	const triggerSync = useCallback(() => {
		if (effectiveOnline) {
			triggerAllSyncs();
		}
	}, [effectiveOnline, triggerAllSyncs]);

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

const personalTransportFactory = () =>
	createSyncTransport(
		async (input) =>
			(await client.todo.sync(input, { signal: input.signal })).data,
		(media, attachments, entityIds) =>
			reconcileMedia({
				db: appDb,
				serverMedia: media,
				serverAttachments: attachments,
				entityIds,
			}),
	);

const createPersonalMediaSyncer = (scopeId: string) =>
	new MediaSyncer({
		db: appDb,
		scopeId,
		scopeType: "personal",
		transport: {
			async sync(input) {
				const res = await client.media.sync(input);
				return res.data;
			},
		},
	});

export function SyncProvider({
	userId,
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: ReactNode;
}) {
	const isOnline = useSyncExternalStore(
		(cb) => networkMonitor.subscribe(cb),
		() => networkMonitor.isOnline,
	);

	const createSyncAdapter = useCallback(
		(uid: string) =>
			createTodoSyncAdapter({
				db: appDb,
				scopeId: uid,
				config: personalTodoConfig,
				filter: (todo) => todo.organizationId === organizationId,
				syncKeySuffix: organizationId,
			}),
		[organizationId],
	);

	const { core, devtools } = useComposedSyncEngine({
		isOnline,
		scopeId: userId,
		createSyncAdapter,
		createSyncTransport: personalTransportFactory,
		createMediaSyncer: createPersonalMediaSyncer,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

const createOrgMediaSyncer = (scopeId: string) =>
	new MediaSyncer({
		db: appDb,
		scopeId,
		scopeType: "org",
		transport: {
			async sync(input) {
				const res = await client.media.orgSync(input);
				return res.data;
			},
		},
	});

export function OrgSyncProvider({
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: ReactNode;
}) {
	const createSyncAdapter = useCallback(
		(orgId: string) =>
			createTodoSyncAdapter({
				db: appDb,
				scopeId: orgId,
				config: orgTodoConfig,
			}),
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
					reconcileMedia({
						db: appDb,
						serverMedia: media,
						serverAttachments: attachments,
						entityIds,
					}),
			),
		[],
	);
	const isOnline = useSyncExternalStore(
		(cb) => networkMonitor.subscribe(cb),
		() => networkMonitor.isOnline,
	);

	const { core, devtools } = useComposedSyncEngine({
		scopeId: organizationId,
		isOnline,
		createSyncAdapter,
		createSyncTransport: createTransport,
		createMediaSyncer: createOrgMediaSyncer,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
