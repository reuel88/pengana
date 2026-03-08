import { useState } from "react";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";

export function useCreateOrg({
	successMessage,
	errorMessage,
	onSuccess,
}: {
	successMessage: string;
	errorMessage: string;
	onSuccess?: () => void | Promise<void>;
}) {
	const { invalidateAll } = useInvalidateOrg();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await authMutation({
			mutationFn: () =>
				authClient.organization.create({
					name,
					slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
					logo: logo || undefined,
				}),
			successMessage,
			errorMessage,
			setLoading,
			onSuccess: async (data) => {
				if (!data) return;
				await authClient.organization.setActive({
					organizationId: data.id,
				});
				await invalidateAll();
				await onSuccess?.();
			},
		});
	};

	const resetForm = () => {
		setName("");
		setSlug("");
		setLogo("");
	};

	return {
		name,
		setName,
		slug,
		setSlug,
		logo,
		setLogo,
		loading,
		handleSubmit,
		resetForm,
	};
}
