import type { SyncDescriptor } from "@pengana/sync/runtime";
import { useEffect, useRef } from "react";
import { authClient } from "@/shared/lib/auth-client";
import {
	createOrgTodoEntryConfig,
	createPersonalTodoEntryConfig,
} from "./sync-runtime-config";
import { syncRuntime } from "./sync-runtime-instance";

/**
 * Root-level coordinator that manages sync runtime entries based on
 * auth session and active organization. Mount once at the app root.
 *
 * - Ensures personal + org todo entries when session is available
 * - Releases and re-creates entries on org switch
 * - Shuts down all entries on logout
 */
export function SyncCoordinator() {
	const { data: session } = authClient.useSession();

	const userId = session?.user?.id ?? null;
	const organizationId = session?.session?.activeOrganizationId ?? null;

	// Track previous descriptors for cleanup on scope change
	const prevDescriptorsRef = useRef<SyncDescriptor[]>([]);

	useEffect(() => {
		if (!userId || !organizationId) {
			// No session or no org — tear down everything
			const prev = prevDescriptorsRef.current;
			if (prev.length > 0) {
				for (const d of prev) {
					void syncRuntime.release(d);
				}
				prevDescriptorsRef.current = [];
			}
			return;
		}

		const personalDescriptor: SyncDescriptor = {
			scopeType: "personal",
			scopeId: userId,
			entityKey: "todo",
		};

		const orgDescriptor: SyncDescriptor = {
			scopeType: "organization",
			scopeId: organizationId,
			entityKey: "todo",
		};

		const nextDescriptors = [personalDescriptor, orgDescriptor];

		// Release any entries that are no longer needed
		const prev = prevDescriptorsRef.current;
		for (const d of prev) {
			const stillNeeded = nextDescriptors.some(
				(n) =>
					n.scopeType === d.scopeType &&
					n.scopeId === d.scopeId &&
					n.entityKey === d.entityKey,
			);
			if (!stillNeeded) {
				void syncRuntime.release(d);
			}
		}

		// Ensure new entries
		syncRuntime.ensure(
			personalDescriptor,
			createPersonalTodoEntryConfig(userId, organizationId),
		);
		syncRuntime.ensure(orgDescriptor, createOrgTodoEntryConfig(organizationId));

		prevDescriptorsRef.current = nextDescriptors;
	}, [userId, organizationId]);

	// Cleanup on unmount (app teardown)
	useEffect(() => {
		return () => {
			void syncRuntime.shutdownAll();
			prevDescriptorsRef.current = [];
		};
	}, []);

	return null;
}
