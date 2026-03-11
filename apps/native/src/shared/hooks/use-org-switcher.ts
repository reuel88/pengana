import { authMutation, useAuthClient } from "@pengana/org-client";
import { useState } from "react";

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
		await authMutation({
			mutationFn: () => authClient.organization.setActive({ organizationId }),
			errorMessage: "Failed to switch organization",
			setLoading: (loading) => {
				setSwitchingId(loading ? organizationId : null);
			},
			onSuccess: async () => {
				await Promise.all([
					invalidateActiveOrg(),
					invalidateActiveMember(),
					invalidateListOrgs(),
				]);
				await onSwitchSuccess?.();
			},
			onError,
		});
	};

	return { handleSwitch, switchingId };
}
