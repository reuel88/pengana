import { createElement, type ReactNode } from "react";

import { SyncContext, SyncDevtoolsContext } from "../context/sync-context";
import { useSyncEngine } from "../hooks/use-sync-engine";
import type { SyncEnginePlatformDeps } from "../hooks/use-sync-engine-core";

interface SyncProviderProps {
	userId: string;
	children: ReactNode;
}

interface OrgSyncProviderProps {
	organizationId?: string;
	userId: string;
	children: ReactNode;
}

export function createSyncProviders(
	personalDeps: SyncEnginePlatformDeps,
	orgDeps: SyncEnginePlatformDeps,
) {
	function SyncProvider({ userId, children }: SyncProviderProps) {
		const { core, devtools } = useSyncEngine(userId, personalDeps);

		return createElement(
			SyncContext,
			{ value: core },
			createElement(SyncDevtoolsContext, { value: devtools }, children),
		);
	}

	function OrgSyncProvider({
		organizationId,
		userId,
		children,
	}: OrgSyncProviderProps) {
		const { core, devtools } = useSyncEngine(organizationId, orgDeps, userId);

		return createElement(
			SyncContext,
			{ value: core },
			createElement(SyncDevtoolsContext, { value: devtools }, children),
		);
	}

	return { SyncProvider, OrgSyncProvider };
}
