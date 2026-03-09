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
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin">("member");
	const [loading, setLoading] = useState(false);

	const handleInvite = async (organizationId: string) => {
		if (!email) return;

		await authMutation({
			mutationFn: () =>
				authClient.organization.inviteMember({
					email,
					role,
					organizationId,
				}),
			errorMessage: "Failed to send invitation",
			onSuccess: async () => {
				setEmail("");
				await invalidateActiveOrg();
				await onSuccess?.();
			},
			setLoading,
			onError,
		});
	};

	const resetForm = () => {
		setEmail("");
		setRole("member");
	};

	return { email, setEmail, role, setRole, handleInvite, loading, resetForm };
}
