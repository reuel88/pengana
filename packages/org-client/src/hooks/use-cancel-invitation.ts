import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useCancelInvitation({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg } = useInvalidateOrg();
	const [cancellingId, setCancellingId] = useState<string | null>(null);

	const handleCancel = async (invitationId: string) => {
		setCancellingId(invitationId);
		await authMutation({
			mutationFn: () =>
				authClient.organization.cancelInvitation({ invitationId }),
			errorMessage: "Failed to cancel invitation",
			onSuccess: async () => {
				await invalidateActiveOrg();
				await onSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setCancellingId(null);
			},
			onError,
		});
	};

	return { handleCancel, cancellingId };
}
