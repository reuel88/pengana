import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";

import { OrgCreateForm } from "@/components/org-create-form";

export function OnboardingCreateOrg({
	onCreated,
	onBackToInvitations,
}: {
	onCreated: () => void;
	onBackToInvitations?: () => void;
}) {
	const { t } = useTranslation("onboarding");

	return (
		<Card className="w-full max-w-md" data-testid="onboarding-create-org">
			<CardHeader>
				<CardTitle>{t("create.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("create.description")}
				</p>
			</CardHeader>
			<CardContent>
				<OrgCreateForm
					onSuccess={onCreated}
					idPrefix="onboard"
					footer={
						onBackToInvitations && (
							<Button
								type="button"
								variant="ghost"
								onClick={onBackToInvitations}
							>
								{t("create.backToInvitations")}
							</Button>
						)
					}
				/>
			</CardContent>
		</Card>
	);
}
