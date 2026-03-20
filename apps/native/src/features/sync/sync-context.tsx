import { useRealtimeTransport } from "@pengana/realtime-transport";
import type { StorageLevel } from "@pengana/storage-health";
import { useStorageHealth } from "@pengana/storage-health";
import { createSyncTransport } from "@pengana/sync-client";
import type { SyncEvent } from "@pengana/sync-engine";
import {
	MAX_EVENT_LOG_SIZE,
	SyncEngine,
	usePeriodicSync,
} from "@pengana/sync-engine";
import type { UploadEvent } from "@pengana/upload-queue";
import { useUploadQueue } from "@pengana/upload-queue";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AppState } from "react-native";
import { useNetworkStatus } from "@/features/sync/use-network-status";
import {
	createDrizzleOrgSyncAdapter as createOrgSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "@/features/todo/entities/todo/adapter";
import { client } from "@/shared/api/orpc";
import {
	createRealtimeTransport,
	getStorageHealthProvider,
	getUploadAdapter,
	getUploadLifecycleCallbacks,
	getUploadTransport,
} from "./platform-deps";
import { reconcileNativeMedia } from "./reconcile-media";

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

// --- Helpers ---

function useAppIsForeground() {
	const [isForeground, setIsForeground] = useState(
		AppState.currentState === "active",
	);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			setIsForeground(nextAppState === "active");
		});
		return () => subscription.remove();
	}, []);

	return isForeground;
}

function useComposedSyncEngine(options: {
	scopeId: string;
	isOnline: boolean;
	isForeground: boolean;
	notifyKey?: string;
	createSyncAdapter: (id: string) => ReturnType<typeof createSyncAdapter>;
	createSyncTransport: () => ReturnType<typeof createSyncTransport>;
}) {
	const {
		scopeId,
		isOnline,
		isForeground,
		notifyKey = scopeId,
		createSyncAdapter: createAdapter,
		createSyncTransport: createTransport,
	} = options;

	const engineRef = useRef<SyncEngine | null>(null);
	const [events, setEvents] = useState<SyncEvent[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const [simulateOffline, setSimulateOffline] = useState(false);
	const effectiveOnline = isOnline && !simulateOffline;

	// --- Engine Init ---
	useEffect(() => {
		const adapter = createAdapter(scopeId);
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
	}, [scopeId, createAdapter, createTransport]);

	// --- Upload Queue ---
	const { isUploading, uploadEvents, enqueueUpload } = useUploadQueue(
		scopeId,
		effectiveOnline,
		{
			createUploadAdapter: getUploadAdapter,
			createUploadTransport: getUploadTransport,
			lifecycleCallbacks: getUploadLifecycleCallbacks(),
			onUploadComplete: () => engineRef.current?.sync(),
		},
	);

	// --- Storage Health ---
	const { storageLevel } = useStorageHealth({
		provider: getStorageHealthProvider(),
	});

	// --- Online Reactivity ---
	useEffect(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	// --- Periodic Sync ---
	usePeriodicSync(effectiveOnline, engineRef);

	// --- Realtime Transport ---
	useRealtimeTransport(notifyKey, effectiveOnline && isForeground, {
		createNotifyTransport: createRealtimeTransport,
		onSyncNotify: () => engineRef.current?.sync(),
		onOpen: () => engineRef.current?.sync(),
	});

	// --- Focus Subscription ---
	useEffect(() => {
		if (!effectiveOnline) return;
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (nextAppState === "active") engineRef.current?.sync();
		});
		return () => subscription.remove();
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
	children: React.ReactNode;
}) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useAppIsForeground();

	const createAdapter = useCallback(
		(uid: string) => createSyncAdapter(uid, { syncKeySuffix: organizationId }),
		[organizationId],
	);

	const createTransport = useCallback(
		() =>
			createSyncTransport(
				async (input) =>
					(await client.todo.sync(input, { signal: input.signal })).data,
				reconcileNativeMedia,
			),
		[],
	);

	const { core, devtools } = useComposedSyncEngine({
		isOnline,
		scopeId: userId,
		isForeground,
		createSyncAdapter: createAdapter,
		createSyncTransport: createTransport,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

const orgAdapter = (organizationId: string) =>
	createOrgSyncAdapter(organizationId);

const orgTransport = () =>
	createSyncTransport(async (input) => {
		return (await client.orgTodo.sync(input, { signal: input.signal })).data;
	}, reconcileNativeMedia);

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
	const isForeground = useAppIsForeground();

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
