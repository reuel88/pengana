import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useInvitationActions({
	onAcceptSuccess,
	onRejectSuccess,
	onError,
}: {
	onAcceptSuccess?: (invitationId: string) => void;
	onRejectSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateUserInvitations, invalidateActiveOrg, invalidateListOrgs } =
		useInvalidateOrg();
	const [actingId, setActingId] = useState<string | null>(null);

	const handleAccept = async (invitationId: string) => {
		setActingId(invitationId);
		await authMutation({
			mutationFn: () =>
				authClient.organization.acceptInvitation({ invitationId }),
			errorMessage: "Failed to accept invitation",
			onSuccess: async () => {
				await onAcceptSuccess?.(invitationId);
				await Promise.all([
					invalidateUserInvitations(),
					invalidateActiveOrg(),
					invalidateListOrgs(),
				]);
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	const handleReject = async (invitationId: string) => {
		setActingId(invitationId);
		await authMutation({
			mutationFn: () =>
				authClient.organization.rejectInvitation({ invitationId }),
			errorMessage: "Failed to reject invitation",
			onSuccess: async () => {
				await invalidateUserInvitations();
				await onRejectSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	return { actingId, handleAccept, handleReject };
}
