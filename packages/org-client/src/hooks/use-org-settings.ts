import { useState } from "react";
import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import type { OrgDesignPreset } from "../lib/design-preset";
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
		name?: string;
		slug?: string;
		logo?: string;
		designPreset?: OrgDesignPreset;
	}) => {
		const payload: {
			name?: string;
			slug?: string;
			logo?: string;
			designPreset?: Record<string, unknown>;
		} = {};

		if (typeof data.name === "string") {
			const trimmedName = data.name.trim();
			if (!trimmedName) return;
			payload.name = trimmedName;
		}

		if (typeof data.slug === "string") {
			payload.slug = data.slug.trim();
		}

		if (typeof data.logo === "string") {
			payload.logo = data.logo.trim() || undefined;
		}

		if (data.designPreset) {
			payload.designPreset = data.designPreset as unknown as Record<
				string,
				unknown
			>;
		}

		if (Object.keys(payload).length === 0) return;

		await authMutation({
			mutationFn: () =>
				authClient.organization.update({
					data: payload,
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
