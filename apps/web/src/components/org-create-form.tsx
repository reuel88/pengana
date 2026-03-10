import { useTranslation } from "@pengana/i18n";
import { createOrgSchema, useCreateOrg, useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { FormRoot } from "@/components/form-root";
import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";

export function OrgCreateForm({
	onSuccess,
	onCancel,
	idPrefix = "org",
	footer,
}: {
	onSuccess: () => void;
	onCancel?: () => void;
	idPrefix?: string;
	footer?: ReactNode;
}) {
	const { t } = useTranslation("organization");

	const { createOrg } = useCreateOrg({
		onSuccess: () => {
			toast.success(t("create.success"));
			onSuccess();
		},
		onError: (message) => toast.error(message || t("create.error")),
	});

	const form = useZodForm({
		schema: createOrgSchema,
		defaultValues: { name: "", slug: "", logo: "" },
		onSubmit: async ({ value }) => {
			const success = await createOrg(value);
			if (success) {
				form.reset();
				onCancel?.();
			}
		},
	});

	return (
		<FormRoot form={form} className="flex flex-col gap-3">
			<form.Field name="name">
				{(field) => <OrgNameField field={field} id={`${idPrefix}-org-name`} />}
			</form.Field>
			<form.Field name="slug">
				{(field) => <OrgSlugField field={field} id={`${idPrefix}-org-slug`} />}
			</form.Field>
			<form.Field name="logo">
				{(field) => <OrgLogoField field={field} id={`${idPrefix}-org-logo`} />}
			</form.Field>
			<form.Subscribe
				selector={(s) => ({
					isSubmitting: s.isSubmitting,
					nameEmpty: !s.values.name.trim(),
				})}
			>
				{({ isSubmitting, nameEmpty }) => (
					<Button type="submit" disabled={isSubmitting || nameEmpty}>
						{isSubmitting ? t("common:submitting") : t("create.submit")}
					</Button>
				)}
			</form.Subscribe>
			{footer}
		</FormRoot>
	);
}
