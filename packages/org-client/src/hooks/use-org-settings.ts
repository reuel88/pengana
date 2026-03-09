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
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [loading, setLoading] = useState(false);

	const syncFromOrg = (org: {
		id: string;
		name: string;
		slug: string;
		logo?: string | null;
	}) => {
		setName(org.name);
		setSlug(org.slug);
		setLogo(org.logo || "");
	};

	const handleUpdate = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		await authMutation({
			mutationFn: () =>
				authClient.organization.update({
					data: {
						name: trimmedName,
						slug: slug.trim(),
						logo: logo.trim() || undefined,
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

	const handleDelete = async (organizationId: string) => {
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

	return {
		name,
		setName,
		slug,
		setSlug,
		logo,
		setLogo,
		syncFromOrg,
		loading,
		handleUpdate,
		handleDelete,
	};
}
