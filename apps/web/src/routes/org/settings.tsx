import { useTranslation } from "@pengana/i18n";
import {
	isOrgDesignPresetEqual,
	normalizeOrgDesignPreset,
	type OrgDesignPreset,
	useOrgSettings,
	useZodForm,
} from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { OrgAppearanceForm } from "@/features/org-management/org-appearance-form";
import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/features/org-management/org-form-fields";
import { useOrgDesignPresetPreview } from "@/features/theme/org-design-preset-preview";
import { useOrgRole } from "@/shared/hooks/use-org-queries";
import { FormRoot } from "@/shared/ui/form-root";
import { useOrgGuard } from "@/widgets/org-guard";

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
	const { isOwner, isAdmin } = useOrgRole();
	const guard = useOrgGuard();
	const { setPreviewDesignPreset } = useOrgDesignPresetPreview();
	const canEditAppearance = isOwner || isAdmin;

	const { updateOrg, deleteOrg, loading } = useOrgSettings({
		onUpdateSuccess: () => toast.success(t("settings.updateSuccess")),
		onDeleteSuccess: () => toast.success(t("settings.deleteSuccess")),
		onError: (message) => toast.error(message || t("settings.error")),
	});

	const form = useZodForm({
		schema: updateOrgSchema,
		defaultValues: {
			name: guard.ready ? guard.activeOrg.name : "",
			slug: guard.ready ? guard.activeOrg.slug : "",
			logo: guard.ready ? (guard.activeOrg.logo ?? "") : "",
		},
		onSubmit: async ({ value }) => {
			await updateOrg(value);
		},
	});

	const orgId = guard.ready ? guard.activeOrg.id : undefined;
	const [designPreset, setDesignPreset] = useState<OrgDesignPreset>(
		normalizeOrgDesignPreset(
			guard.ready ? guard.activeOrg.designPreset : undefined,
		),
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (guard.ready) {
			form.reset({
				name: guard.activeOrg.name,
				slug: guard.activeOrg.slug,
				logo: guard.activeOrg.logo ?? "",
			});
			setDesignPreset(normalizeOrgDesignPreset(guard.activeOrg.designPreset));
		}
	}, [orgId]);

	useEffect(() => {
		if (!guard.ready || !canEditAppearance) return;
		setPreviewDesignPreset(designPreset);

		return () => {
			setPreviewDesignPreset(null);
		};
	}, [canEditAppearance, designPreset, guard.ready, setPreviewDesignPreset]);

	if (!guard.ready) return guard.guardElement;

	const { activeOrg } = guard;
	const currentPreset = normalizeOrgDesignPreset(activeOrg.designPreset);
	const designPresetChanged = !isOrgDesignPresetEqual(
		currentPreset,
		designPreset,
	);

	const onDelete = async () => {
		if (!confirm(t("settings.deleteConfirm"))) return;
		await deleteOrg(activeOrg.id);
	};

	return (
		<div className="flex max-w-4xl flex-col gap-6">
			{isAdmin ? (
				<FormRoot form={form} className="flex flex-col gap-3">
					<h2 className="font-medium text-sm">{t("settings.update")}</h2>
					<form.Field name="name">
						{(field) => <OrgNameField field={field} id="org-name" />}
					</form.Field>
					<form.Field name="slug">
						{(field) => <OrgSlugField field={field} id="org-slug" required />}
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
				<p className="text-muted-foreground text-sm">{t("settings.title")}</p>
			)}

			<OrgAppearanceForm
				designPreset={designPreset}
				onDesignPresetChange={setDesignPreset}
				canEdit={canEditAppearance}
				hasChanges={designPresetChanged}
				loading={loading}
				onSave={() => void updateOrg({ designPreset })}
			/>

			{isOwner && (
				<div className="border-t pt-4">
					<Button variant="destructive" onClick={onDelete} disabled={loading}>
						{t("settings.delete")}
					</Button>
				</div>
			)}
		</div>
	);
}
