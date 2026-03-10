import { useTranslation } from "@pengana/i18n";
import { createOrgSchema, useCreateOrg, useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import {
	Dialog,
	DialogCloseButton,
	DialogDescription,
	DialogPopup,
	DialogTitle,
} from "@pengana/ui/components/dialog";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";

export function CreateOrgDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("organization");
	const navigate = useNavigate();

	const { createOrg } = useCreateOrg({
		onSuccess: () => {
			toast.success(t("create.success"));
			navigate({ to: "/org" });
		},
		onError: (message) => toast.error(message || t("create.error")),
	});

	const form = useZodForm({
		schema: createOrgSchema,
		defaultValues: { name: "", slug: "", logo: "" },
		onSubmit: async ({ value }) => {
			await createOrg(value);
			form.reset();
			onOpenChange(false);
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
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="mt-4 flex flex-col gap-3"
				>
					<form.Field name="name">
						{(field) => <OrgNameField field={field} id="dialog-org-name" />}
					</form.Field>
					<form.Field name="slug">
						{(field) => <OrgSlugField field={field} id="dialog-org-slug" />}
					</form.Field>
					<form.Field name="logo">
						{(field) => <OrgLogoField field={field} id="dialog-org-logo" />}
					</form.Field>
					<form.Subscribe
						selector={(s) => ({
							isSubmitting: s.isSubmitting,
							nameEmpty: !s.values.name.trim(),
						})}
					>
						{({ isSubmitting, nameEmpty }) => (
							<Button type="submit" disabled={isSubmitting || nameEmpty}>
								{isSubmitting ? t("common:submitting") : t("create.submit")}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</DialogPopup>
		</Dialog>
	);
}
