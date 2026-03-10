import { useTranslation } from "@pengana/i18n";
import {
	Dialog,
	DialogCloseButton,
	DialogDescription,
	DialogPopup,
	DialogTitle,
} from "@pengana/ui/components/dialog";
import { useNavigate } from "@tanstack/react-router";

import { OrgCreateForm } from "@/components/org-create-form";

export function CreateOrgDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("organization");
	const navigate = useNavigate();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogCloseButton />
				<DialogTitle>{t("create.title")}</DialogTitle>
				<DialogDescription className="mt-1">
					{t("create.description")}
				</DialogDescription>
				<div className="mt-4">
					<OrgCreateForm
						onSuccess={() => navigate({ to: "/org" })}
						onCancel={() => onOpenChange(false)}
						idPrefix="dialog"
					/>
				</div>
			</DialogPopup>
		</Dialog>
	);
}
