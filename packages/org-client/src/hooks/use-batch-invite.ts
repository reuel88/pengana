import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { useInvalidateOrg } from "./use-org-queries";

export function useBatchInvite({
	organizationId,
	onSuccess,
	onPartialFailure,
	onError,
}: {
	organizationId: string | undefined;
	onSuccess?: () => void;
	onPartialFailure?: (failedCount: number) => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg } = useInvalidateOrg();
	const [loading, setLoading] = useState(false);

	const batchInvite = async (
		entries: Array<{ email: string; role: "member" | "admin" }>,
	) => {
		if (!organizationId || entries.length === 0) return;

		setLoading(true);
		try {
			const results = await Promise.allSettled(
				entries.map(async (entry) => {
					const { error } = await authClient.organization.inviteMember({
						email: entry.email.trim(),
						role: entry.role,
						organizationId,
					});
					if (error) throw error;
				}),
			);

			const failed = results.filter((r) => r.status === "rejected");
			if (failed.length > 0) {
				onPartialFailure?.(failed.length);
			}
			if (failed.length < results.length) {
				await invalidateActiveOrg();
				onSuccess?.();
			} else {
				onError?.("All invitations failed");
			}
		} catch {
			onError?.("Failed to send invitations");
		} finally {
			setLoading(false);
		}
	};

	return { batchInvite, loading };
}
