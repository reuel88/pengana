import { useTranslation } from "@pengana/i18n";
import { useOrgSettings, useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormRoot } from "@/components/form-root";
import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";
import { OrgGuard } from "@/components/org-guard";
import { useActiveOrg, useOrgRole } from "@/hooks/use-org-queries";

export const Route = createFileRoute("/org/settings")({
	component: OrgSettingsPage,
});

const updateOrgSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	logo: z.string(),
});

function OrgSettingsPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg } = useActiveOrg();
	const { isOwner, isAdmin } = useOrgRole();

	const { updateOrg, deleteOrg, loading } = useOrgSettings({
		onUpdateSuccess: () => toast.success(t("settings.updateSuccess")),
		onDeleteSuccess: () => toast.success(t("settings.deleteSuccess")),
		onError: (message) => toast.error(message || t("settings.error")),
	});

	const form = useZodForm({
		schema: updateOrgSchema,
		defaultValues: {
			name: activeOrg?.name ?? "",
			slug: activeOrg?.slug ?? "",
			logo: activeOrg?.logo ?? "",
		},
		onSubmit: async ({ value }) => {
			await updateOrg(value);
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (activeOrg) {
			form.reset({
				name: activeOrg.name,
				slug: activeOrg.slug,
				logo: activeOrg.logo ?? "",
			});
		}
	}, [activeOrg?.id]);

	return (
		<OrgGuard>
			{(org) => {
				const onDelete = async () => {
					if (!confirm(t("settings.deleteConfirm"))) return;
					await deleteOrg(org.id);
				};

				return (
					<div className="flex max-w-md flex-col gap-6">
						{isAdmin ? (
							<FormRoot form={form} className="flex flex-col gap-3">
								<h2 className="font-medium text-sm">{t("settings.update")}</h2>
								<form.Field name="name">
									{(field) => <OrgNameField field={field} id="org-name" />}
								</form.Field>
								<form.Field name="slug">
									{(field) => (
										<OrgSlugField field={field} id="org-slug" required />
									)}
								</form.Field>
								<form.Field name="logo">
									{(field) => <OrgLogoField field={field} id="org-logo" />}
								</form.Field>
								<form.Subscribe selector={(s) => s.isSubmitting}>
									{(isSubmitting) => (
										<Button type="submit" disabled={isSubmitting || loading}>
											{isSubmitting || loading
												? t("common:submitting")
												: t("settings.update")}
										</Button>
									)}
								</form.Subscribe>
							</FormRoot>
						) : (
							<p className="text-muted-foreground text-sm">
								{t("settings.title")}
							</p>
						)}

						{isOwner && (
							<div className="border-t pt-4">
								<Button
									variant="destructive"
									onClick={onDelete}
									disabled={loading}
								>
									{t("settings.delete")}
								</Button>
							</div>
						)}
					</div>
				);
			}}
		</OrgGuard>
	);
}
