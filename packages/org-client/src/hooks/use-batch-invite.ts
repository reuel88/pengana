import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { useInvalidateOrg } from "./use-org-queries";

interface InviteEntry {
	id: string;
	email: string;
	role: "member" | "admin";
}

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
	const [entries, setEntries] = useState<InviteEntry[]>([]);
	const [loading, setLoading] = useState(false);

	const addEntry = (id: string) => {
		setEntries((prev) => [...prev, { id, email: "", role: "member" }]);
	};

	const removeEntry = (index: number) => {
		setEntries((prev) => prev.filter((_, i) => i !== index));
	};

	const updateEntry = (index: number, updates: Partial<InviteEntry>) => {
		setEntries((prev) =>
			prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry)),
		);
	};

	const validEntries = entries.filter((e) => e.email.trim() !== "");

	const handleSubmit = async () => {
		if (!organizationId || validEntries.length === 0) return;

		setLoading(true);
		try {
			const results = await Promise.allSettled(
				validEntries.map(async (entry) => {
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

	return {
		entries,
		addEntry,
		removeEntry,
		updateEntry,
		validEntries,
		handleSubmit,
		loading,
	};
}
