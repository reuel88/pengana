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

import { useCreateOrg } from "@/hooks/use-create-org";

export function CreateOrgDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("organization");
	const navigate = useNavigate();

	const {
		name,
		setName,
		slug,
		setSlug,
		logo,
		setLogo,
		loading,
		handleSubmit,
		resetForm,
	} = useCreateOrg({
		successMessage: t("create.success"),
		errorMessage: t("create.error"),
		onSuccess: () => {
			onOpenChange(false);
			resetForm();
			navigate({ to: "/org" });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogCloseButton />
				<DialogTitle>{t("create.title")}</DialogTitle>
				<DialogDescription className="mt-1">
					{t("create.description")}
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
