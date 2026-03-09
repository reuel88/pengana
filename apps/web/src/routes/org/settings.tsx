import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";
import { OrgGuard } from "@/components/org-guard";
import {
	useActiveOrg,
	useOrgRole,
	useOrgSettings,
} from "@/hooks/use-org-queries";

export const Route = createFileRoute("/org/settings")({
	component: OrgSettingsPage,
});

function OrgSettingsPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg } = useActiveOrg();
	const { isOwner, isAdmin } = useOrgRole();

	const {
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
	} = useOrgSettings({
		onUpdateSuccess: () => toast.success(t("settings.updateSuccess")),
		onDeleteSuccess: () => toast.success(t("settings.deleteSuccess")),
		onError: (message) => toast.error(message || t("settings.error")),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (activeOrg) syncFromOrg(activeOrg);
	}, [activeOrg?.id]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleUpdate();
	};

	return (
		<OrgGuard>
			{(org) => {
				const onDelete = async () => {
					if (!confirm(t("settings.deleteConfirm"))) return;
					await handleDelete(org.id);
				};

				return (
					<div className="flex max-w-md flex-col gap-6">
						{isAdmin ? (
							<form onSubmit={onSubmit} className="flex flex-col gap-3">
								<h2 className="font-medium text-sm">{t("settings.update")}</h2>
								<OrgNameField value={name} onChange={setName} id="org-name" />
								<OrgSlugField
									value={slug}
									onChange={setSlug}
									id="org-slug"
									required
								/>
								<OrgLogoField value={logo} onChange={setLogo} id="org-logo" />
								<Button type="submit" disabled={loading}>
									{loading ? t("common:submitting") : t("settings.update")}
								</Button>
							</form>
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
