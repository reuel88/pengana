import type { SyncContextValue } from "@pengana/sync-engine";

import { createContext, use } from "react";

import { useSyncEngine } from "./use-sync-engine";

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({
	userId,
	children,
}: {
	userId: string;
	children: React.ReactNode;
}) {
	const sync = useSyncEngine(userId);

	return <SyncContext value={sync}>{children}</SyncContext>;
}

export function useSync(): SyncContextValue {
	const context = use(SyncContext);
	if (!context) {
		throw new Error("useSync must be used within a SyncProvider");
	}
	return context;
}
