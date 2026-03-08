import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Dialog,
	DialogCloseButton,
	DialogDescription,
	DialogPopup,
	DialogTitle,
} from "@pengana/ui/components/dialog";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";

export function CreateOrgDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
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
			onOpenChange(false);
			setName("");
			setSlug("");
			setLogo("");
			navigate({ to: "/org" });
		} catch {
			toast.error(t("create.error"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogCloseButton />
				<DialogTitle>{t("create.title")}</DialogTitle>
				<DialogDescription className="mt-1">
					{t("create.title")}
				</DialogDescription>
				<form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<Label>{t("create.name")}</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("create.namePlaceholder")}
							required
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label>{t("create.slug")}</Label>
						<Input
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder={t("create.slugPlaceholder")}
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
					<Button type="submit" disabled={loading || !name}>
						{loading ? t("common:submitting") : t("create.submit")}
					</Button>
				</form>
			</DialogPopup>
		</Dialog>
	);
}
