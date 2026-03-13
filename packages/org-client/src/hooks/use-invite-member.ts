import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useInviteMember({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg } = useInvalidateOrg();
	const [loading, setLoading] = useState(false);

	const inviteMember = async (data: {
		email: string;
		role: "member" | "admin";
		organizationId: string;
	}) => {
		if (!data.email) return false;

		return authMutation({
			mutationFn: () =>
				authClient.organization.inviteMember({
					email: data.email,
					role: data.role,
					organizationId: data.organizationId,
				}),
			errorMessage: "Failed to send invitation",
			preferServerErrorMessage: false,
			onSuccess: async () => {
				await invalidateActiveOrg();
				await onSuccess?.();
			},
			setLoading,
			onError,
		});
	};

	return { inviteMember, loading };
}
