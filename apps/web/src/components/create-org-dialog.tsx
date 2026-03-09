import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Dialog,
	DialogCloseButton,
	DialogDescription,
	DialogPopup,
	DialogTitle,
} from "@pengana/ui/components/dialog";
import { useNavigate } from "@tanstack/react-router";

import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";
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
					<OrgNameField value={name} onChange={setName} id="dialog-org-name" />
					<OrgSlugField value={slug} onChange={setSlug} id="dialog-org-slug" />
					<OrgLogoField value={logo} onChange={setLogo} id="dialog-org-logo" />
					<Button type="submit" disabled={loading || !name}>
						{loading ? t("common:submitting") : t("create.submit")}
					</Button>
				</form>
			</DialogPopup>
		</Dialog>
	);
}
