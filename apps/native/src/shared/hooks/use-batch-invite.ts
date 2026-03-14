import { useAuthClient } from "@pengana/org-client";
import { useState } from "react";

import type {
	BatchInviteEntry,
	BatchInviteFailure,
} from "./use-batch-invite.helpers";
import { runBatchInvitePostProcessing } from "./use-batch-invite.helpers";
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

	const batchInvite = async (entries: BatchInviteEntry[]) => {
		if (entries.length === 0) {
			return { successes: [], failures: [] };
		}

		if (!organizationId) {
			onError?.("Missing organization");
			return {
				successes: [],
				failures: entries.map((entry) => ({
					...entry,
					reason: "missing-organization",
				})),
			};
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
			const failures: BatchInviteFailure[] = entries.filter(
				(_entry, index) => results[index]?.status === "rejected",
			);

			return runBatchInvitePostProcessing({
				result: { successes, failures },
				totalCount: results.length,
				invalidateActiveOrg,
				onSuccess,
				onError,
			});
		} catch {
			onError?.("Failed to send invitations");
			return { successes: [], failures: entries };
		} finally {
			setLoading(false);
		}
	};

	return { batchInvite, loading };
}
