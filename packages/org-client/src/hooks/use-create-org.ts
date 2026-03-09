import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { slugify } from "../lib/slugify";
import { useInvalidateOrg } from "./use-org-queries";

interface OrgFormState {
	name: string;
	slug: string;
	logo: string;
}

const initialFormState: OrgFormState = { name: "", slug: "", logo: "" };

export function useCreateOrg({
	onSubmit,
	onSuccess,
	onError,
}: {
	onSubmit?: () => void;
	onSuccess?: (orgId: string) => void | Promise<void>;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateAll } = useInvalidateOrg();
	const [form, setForm] = useState<OrgFormState>(initialFormState);
	const [loading, setLoading] = useState(false);

	const setName = (name: string) => setForm((prev) => ({ ...prev, name }));
	const setSlug = (slug: string) => setForm((prev) => ({ ...prev, slug }));
	const setLogo = (logo: string) => setForm((prev) => ({ ...prev, logo }));

	const handleSubmit = async () => {
		onSubmit?.();
		const trimmedName = form.name.trim();
		if (!trimmedName) return;

		setLoading(true);
		try {
			const { data, error } = await authClient.organization.create({
				name: trimmedName,
				slug: form.slug.trim() || slugify(trimmedName),
				logo: form.logo.trim() || undefined,
			});
			if (error) {
				onError?.(error.message ?? "Failed to create organization");
				return;
			}
			if (!data) return;
			const setActiveResult = await authClient.organization.setActive({
				organizationId: data.id,
			});
			if (setActiveResult.error) {
				onError?.(
					setActiveResult.error.message ?? "Failed to set active organization",
				);
				return;
			}
			await invalidateAll();
			await onSuccess?.(data.id);
		} catch {
			onError?.("Failed to create organization");
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => setForm(initialFormState);

	return {
		name: form.name,
		setName,
		slug: form.slug,
		setSlug,
		logo: form.logo,
		setLogo,
		loading,
		handleSubmit,
		resetForm,
	};
}
