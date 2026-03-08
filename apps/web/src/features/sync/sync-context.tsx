import type { SyncContextValue, SyncDevtoolsValue } from "@pengana/sync-engine";

import { createContext, use } from "react";

import { useSyncEngine } from "./use-sync-engine";

const SyncContext = createContext<SyncContextValue | null>(null);
const SyncDevtoolsContext = createContext<SyncDevtoolsValue | null>(null);

export function SyncProvider({
	userId,
	children,
}: {
	userId: string;
	children: React.ReactNode;
}) {
	const { core, devtools } = useSyncEngine(userId);

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

export function useSync(): SyncContextValue {
	const context = use(SyncContext);
	if (!context) {
		throw new Error("useSync must be used within a SyncProvider");
	}
	return context;
}

export function useSyncDevtools(): SyncDevtoolsValue {
	const context = use(SyncDevtoolsContext);
	if (!context) {
		throw new Error("useSyncDevtools must be used within a SyncProvider");
	}
	return context;
}
