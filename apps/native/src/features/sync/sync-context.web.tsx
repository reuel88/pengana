import { subscribeToSharedNotifyChannel } from "@pengana/realtime-transport";
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
import { reconcileMedia } from "@pengana/upload-client";
import type { EnqueueUploadParams, UploadEvent } from "@pengana/upload-queue";
import { UploadQueueManager } from "@pengana/upload-queue";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useNetworkStatus } from "@/features/sync/use-network-status";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import {
	createRealtimeTransport,
	getStorageHealthProvider,
	getUploadAdapter,
	getUploadLifecycleCallbacks,
	getUploadTransport,
} from "./platform-deps";

// --- Context types ---

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

// --- Helpers ---

function useDocumentVisible() {
	const [isVisible, setIsVisible] = useState(
		document.visibilityState === "visible",
	);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(document.visibilityState === "visible");
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	return isVisible;
}

function useComposedSyncEngine(options: {
	scopeId: string;
	isOnline: boolean;
	isForeground: boolean;
	notifyKey?: string;
	createSyncAdapter: (id: string) => ReturnType<typeof createTodoSyncAdapter>;
	createSyncTransport: () => ReturnType<typeof createSyncTransport>;
}) {
	const {
		scopeId,
		isOnline,
		isForeground,
		notifyKey = scopeId,
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
	const managerRef = useRef(
		new UploadQueueManager({
			createUploadAdapter: getUploadAdapter,
			createUploadTransport: getUploadTransport,
			lifecycleCallbacks: getUploadLifecycleCallbacks(),
			onSettled: () => engineRef.current?.sync(),
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
	const storageMonitorRef = useRef<StorageHealthMonitor | null>(null);
	if (storageMonitorRef.current === null) {
		storageMonitorRef.current = new StorageHealthMonitor({
			provider: getStorageHealthProvider(),
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
	useEffect(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

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
					engineRef.current?.sync();
				}
			},
			onOpen: () => {
				engineRef.current?.sync();
			},
		});

		realtimeSubRef.current = subscription;
		return () => {
			subscription.unsubscribe();
			if (realtimeSubRef.current === subscription) {
				realtimeSubRef.current = null;
			}
		};
	}, [notifyKey]);

	useEffect(() => {
		realtimeSubRef.current?.setEnabled(effectiveOnline && isForeground);
	}, [effectiveOnline, isForeground]);

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

export function SyncProvider({
	userId,
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: React.ReactNode;
}) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useDocumentVisible();

	const createAdapter = useCallback(
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
		isForeground,
		createSyncAdapter: createAdapter,
		createSyncTransport: personalTransportFactory,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

const orgAdapter = (organizationId: string) =>
	createTodoSyncAdapter({
		db: appDb,
		scopeId: organizationId,
		config: orgTodoConfig,
	});

const orgTransport = () =>
	createSyncTransport(
		async (input) => {
			return (await client.orgTodo.sync(input, { signal: input.signal })).data;
		},
		(media, attachments, entityIds) =>
			reconcileMedia({
				db: appDb,
				serverMedia: media,
				serverAttachments: attachments,
				entityIds,
			}),
	);

export function OrgSyncProvider({
	organizationId,
	userId,
	children,
}: {
	organizationId: string;
	userId: string;
	children: React.ReactNode;
}) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useDocumentVisible();

	const { core, devtools } = useComposedSyncEngine({
		isOnline,
		scopeId: organizationId,
		isForeground,
		notifyKey: userId,
		createSyncAdapter: orgAdapter,
		createSyncTransport: orgTransport,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
