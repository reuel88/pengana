import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";

export function OnboardingCreateOrg({
	onCreated,
	onBackToInvitations,
}: {
	onCreated: () => void;
	onBackToInvitations?: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { invalidateAll } = useInvalidateOrg();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { data, error } = await authClient.organization.create({
				name,
				slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
				logo: logo || undefined,
			});
			if (error) {
				toast.error(error.message || t("create.error"));
				return;
			}
			await authClient.organization.setActive({
				organizationId: data.id,
			});
			await invalidateAll();
			toast.success(t("create.success"));
			onCreated();
		} catch {
			toast.error(t("create.error"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>{t("create.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("create.description")}
				</p>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<Label>{t("organization:create.name")}</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("organization:create.namePlaceholder")}
							required
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label>{t("organization:create.slug")}</Label>
						<Input
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder={t("organization:create.slugPlaceholder")}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label>{t("organization:create.logo")}</Label>
						<Input
							value={logo}
							onChange={(e) => setLogo(e.target.value)}
							placeholder={t("organization:create.logoPlaceholder")}
						/>
					</div>
					<Button type="submit" disabled={loading || !name}>
						{loading ? t("common:submitting") : t("organization:create.submit")}
					</Button>
					{onBackToInvitations && (
						<Button type="button" variant="ghost" onClick={onBackToInvitations}>
							{t("create.backToInvitations")}
						</Button>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
