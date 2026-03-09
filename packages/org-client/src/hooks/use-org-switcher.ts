import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useOrgSwitcher({
	onSwitchSuccess,
	onError,
}: {
	onSwitchSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg, invalidateActiveMember, invalidateListOrgs } =
		useInvalidateOrg();
	const [switchingId, setSwitchingId] = useState<string | null>(null);

	const handleSwitch = async (organizationId: string) => {
		setSwitchingId(organizationId);
		await authMutation({
			mutationFn: () => authClient.organization.setActive({ organizationId }),
			errorMessage: "Failed to switch organization",
			onSuccess: async () => {
				await Promise.all([
					invalidateActiveOrg(),
					invalidateActiveMember(),
					invalidateListOrgs(),
				]);
				await onSwitchSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setSwitchingId(null);
			},
			onError,
		});
	};

	return { handleSwitch, switchingId };
}
