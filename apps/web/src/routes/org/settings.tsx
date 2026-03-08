import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useActiveOrg, useInvalidateOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";

export const Route = createFileRoute("/org/settings")({
	component: OrgSettingsPage,
});

function OrgSettingsPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isOwner, isAdmin } = useOrgRole();
	const { invalidateActiveOrg, invalidateListOrgs, invalidateAll } =
		useInvalidateOrg();
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (activeOrg) {
			setName(activeOrg.name);
			setSlug(activeOrg.slug);
			setLogo(activeOrg.logo || "");
		}
	}, [activeOrg?.id]);

	if (isPending) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		await authMutation({
			mutationFn: () =>
				authClient.organization.update({
					data: { name, slug, logo: logo || undefined },
				}),
			successMessage: t("settings.updateSuccess"),
			errorMessage: t("settings.error"),
			setLoading,
			onSuccess: () =>
				Promise.all([invalidateActiveOrg(), invalidateListOrgs()]),
		});
	};

	const handleDelete = async () => {
		if (!confirm(t("settings.deleteConfirm"))) return;
		await authMutation({
			mutationFn: () =>
				authClient.organization.delete({ organizationId: activeOrg.id }),
			successMessage: t("settings.deleteSuccess"),
			errorMessage: t("settings.error"),
			onSuccess: () => invalidateAll(),
		});
	};

	return (
		<div className="flex max-w-md flex-col gap-6">
			{isAdmin ? (
				<form onSubmit={handleUpdate} className="flex flex-col gap-3">
					<h2 className="font-medium text-sm">{t("settings.update")}</h2>
					<div className="flex flex-col gap-1">
						<Label>{t("create.name")}</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label>{t("create.slug")}</Label>
						<Input
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label>{t("create.logo")}</Label>
						<Input
							value={logo}
							onChange={(e) => setLogo(e.target.value)}
							placeholder={t("create.logoPlaceholder")}
						/>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? t("common:submitting") : t("settings.update")}
					</Button>
				</form>
			) : (
				<p className="text-muted-foreground text-sm">{t("settings.title")}</p>
			)}

			{isOwner && (
				<div className="border-t pt-4">
					<Button variant="destructive" onClick={handleDelete}>
						{t("settings.delete")}
					</Button>
				</div>
			)}
		</div>
	);
}
