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
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { useOrgSettings } from "@/hooks/use-org-settings";

export const Route = createFileRoute("/org/settings")({
	component: OrgSettingsPage,
});

function OrgSettingsPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
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

	if (isPending) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleUpdate();
	};

	const onDelete = async () => {
		if (!confirm(t("settings.deleteConfirm"))) return;
		await handleDelete(activeOrg.id);
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
				<p className="text-muted-foreground text-sm">{t("settings.title")}</p>
			)}

			{isOwner && (
				<div className="border-t pt-4">
					<Button variant="destructive" onClick={onDelete}>
						{t("settings.delete")}
					</Button>
				</div>
			)}
		</div>
	);
}
