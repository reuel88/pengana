import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { useInvalidateOrg } from "./use-org-queries";

export function useBatchInvite({
	organizationId,
	onSuccess,
	onError,
}: {
	organizationId: string | undefined;
	onSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg } = useInvalidateOrg();
	const [loading, setLoading] = useState(false);

	const batchInvite = async (
		entries: Array<{ email: string; role: "member" | "admin" }>,
	) => {
		if (!organizationId || entries.length === 0) {
			return { successes: [], failures: [] };
		}

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

			const successes = entries.filter(
				(_entry, index) => results[index]?.status === "fulfilled",
			);
			const failures = entries.filter(
				(_entry, index) => results[index]?.status === "rejected",
			);

			if (successes.length > 0) {
				await invalidateActiveOrg();
			}

			if (failures.length === results.length) {
				onError?.("All invitations failed");
			} else if (failures.length === 0) {
				onSuccess?.();
			}
			return { successes, failures };
		} catch {
			onError?.("Failed to send invitations");
			return { successes: [], failures: entries };
		} finally {
			setLoading(false);
		}
	};

	return { batchInvite, loading };
}
