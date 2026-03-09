import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useOrgSettings({
	onUpdateSuccess,
	onDeleteSuccess,
	onError,
}: {
	onUpdateSuccess?: () => void;
	onDeleteSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg, invalidateListOrgs, invalidateAll } =
		useInvalidateOrg();
	const [loading, setLoading] = useState(false);

	const updateOrg = async (data: {
		name: string;
		slug: string;
		logo: string;
	}) => {
		const trimmedName = data.name.trim();
		if (!trimmedName) return;

		await authMutation({
			mutationFn: () =>
				authClient.organization.update({
					data: {
						name: trimmedName,
						slug: data.slug.trim(),
						logo: data.logo.trim() || undefined,
					},
				}),
			errorMessage: "Failed to update organization",
			onSuccess: async () => {
				await Promise.all([invalidateActiveOrg(), invalidateListOrgs()]);
				await onUpdateSuccess?.();
			},
			setLoading,
			onError,
		});
	};

	const deleteOrg = async (organizationId: string) => {
		await authMutation({
			mutationFn: () => authClient.organization.delete({ organizationId }),
			errorMessage: "Failed to delete organization",
			onSuccess: async () => {
				await invalidateAll();
				await onDeleteSuccess?.();
			},
			setLoading,
			onError,
		});
	};

	return { updateOrg, deleteOrg, loading };
}
