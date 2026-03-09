import { createContext, use } from "react";

import type { SyncContextValue, SyncDevtoolsValue } from "../types";

export const SyncContext = createContext<SyncContextValue | null>(null);
export const SyncDevtoolsContext = createContext<SyncDevtoolsValue | null>(
	null,
);

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
