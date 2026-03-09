import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";

import {
	OrgLogoField,
	OrgNameField,
	OrgSlugField,
} from "@/components/org-form-fields";
import { useCreateOrg } from "@/hooks/use-create-org";

export function OnboardingCreateOrg({
	onCreated,
	onBackToInvitations,
}: {
	onCreated: () => void;
	onBackToInvitations?: () => void;
}) {
	const { t } = useTranslation("onboarding");

	const { name, setName, slug, setSlug, logo, setLogo, loading, handleSubmit } =
		useCreateOrg({
			successMessage: t("create.success"),
			errorMessage: t("create.error"),
			onSuccess: onCreated,
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
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<OrgNameField value={name} onChange={setName} id="onboard-org-name" />
					<OrgSlugField value={slug} onChange={setSlug} id="onboard-org-slug" />
					<OrgLogoField value={logo} onChange={setLogo} id="onboard-org-logo" />
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
