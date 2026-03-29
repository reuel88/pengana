import type { SyncDescriptor } from "@pengana/sync/runtime";
import { useEffect, useRef } from "react";
import { authClient } from "@/shared/lib/auth-client";
import {
	createOrgTodoEntryConfig,
	createPersonalTodoEntryConfig,
} from "./sync-runtime-config";
import { syncRuntime } from "./sync-runtime-instance";

export function SyncCoordinator() {
	const { data: session } = authClient.useSession();

	const userId = session?.user?.id ?? null;
	const organizationId = session?.session?.activeOrganizationId ?? null;

	const prevDescriptorsRef = useRef<SyncDescriptor[]>([]);

	useEffect(() => {
		if (!userId || !organizationId) {
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
			entityKey: "sync",
		};

		const orgDescriptor: SyncDescriptor = {
			scopeType: "organization",
			scopeId: organizationId,
			entityKey: "sync",
		};

		const nextDescriptors = [personalDescriptor, orgDescriptor];

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

		syncRuntime.ensure(
			personalDescriptor,
			createPersonalTodoEntryConfig(userId, organizationId),
		);
		syncRuntime.ensure(
			orgDescriptor,
			createOrgTodoEntryConfig(organizationId, userId),
		);

		prevDescriptorsRef.current = nextDescriptors;
	}, [userId, organizationId]);

	useEffect(() => {
		return () => {
			void syncRuntime.shutdownAll();
			prevDescriptorsRef.current = [];
		};
	}, []);

	return null;
}
