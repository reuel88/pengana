import { useTranslation } from "@pengana/i18n";
import { useCreateOrg } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { toast } from "sonner";
import { z } from "zod";

import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";
import { useZodForm } from "@/hooks/use-zod-form";

const createOrgSchema = z.object({
	name: z.string().min(1),
	slug: z.string(),
	logo: z.string(),
});

export function OnboardingCreateOrg({
	onCreated,
	onBackToInvitations,
}: {
	onCreated: () => void;
	onBackToInvitations?: () => void;
}) {
	const { t } = useTranslation("onboarding");

	const { createOrg } = useCreateOrg({
		onSuccess: () => {
			toast.success(t("create.success"));
			onCreated();
		},
		onError: (message) => toast.error(message || t("create.error")),
	});

	const form = useZodForm({
		schema: createOrgSchema,
		defaultValues: { name: "", slug: "", logo: "" },
		onSubmit: async ({ value }) => {
			await createOrg(value);
		},
	});

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>{t("create.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("create.description")}
				</p>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-3"
				>
					<form.Field name="name">
						{(field) => <OrgNameField field={field} id="onboard-org-name" />}
					</form.Field>
					<form.Field name="slug">
						{(field) => <OrgSlugField field={field} id="onboard-org-slug" />}
					</form.Field>
					<form.Field name="logo">
						{(field) => <OrgLogoField field={field} id="onboard-org-logo" />}
					</form.Field>
					<form.Subscribe
						selector={(s): [boolean, boolean] => [
							s.isSubmitting,
							!s.values.name,
						]}
					>
						{([isSubmitting, nameEmpty]) => (
							<Button type="submit" disabled={isSubmitting || nameEmpty}>
								{isSubmitting
									? t("common:submitting")
									: t("organization:create.submit")}
							</Button>
						)}
					</form.Subscribe>
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
