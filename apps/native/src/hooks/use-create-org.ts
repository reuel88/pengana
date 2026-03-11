import { slugify, useAuthClient } from "@pengana/org-client";
import { useState } from "react";

import { useInvalidateOrg } from "./use-org-queries";

export function useCreateOrg({
	onSuccess,
	onError,
}: {
	onSuccess?: (orgId: string) => void | Promise<void>;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateAll } = useInvalidateOrg();
	const [loading, setLoading] = useState(false);

	const createOrg = async (data: {
		name: string;
		slug: string;
		logo: string;
	}) => {
		const trimmedName = data.name.trim();
		if (!trimmedName) return;

		setLoading(true);
		try {
			const { data: orgData, error } = await authClient.organization.create({
				name: trimmedName,
				slug: data.slug.trim() || slugify(trimmedName),
				logo: data.logo.trim() || undefined,
			});
			if (error) {
				onError?.(error.message ?? "Failed to create organization");
				return;
			}
			if (!orgData) {
				onError?.("Failed to create organization");
				return;
			}

			const setActiveResult = await authClient.organization.setActive({
				organizationId: orgData.id,
			});
			if (setActiveResult.error) {
				onError?.(
					setActiveResult.error.message ?? "Failed to set active organization",
				);
				return;
			}

			await invalidateAll();
			await onSuccess?.(orgData.id);
			return true;
		} catch {
			onError?.("Failed to create organization");
		} finally {
			setLoading(false);
		}
	};

	return { createOrg, loading };
}
