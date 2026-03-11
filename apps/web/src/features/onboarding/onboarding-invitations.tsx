import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";

import { InvitationCard } from "@/components/invitation-card";
import { useInvitationActions } from "@/hooks/use-invitation-actions";
import { useUserInvitations } from "@/hooks/use-org-queries";

export function OnboardingInvitations({
	onAccepted,
	onSkipToCreate,
}: {
	onAccepted: () => void;
	onSkipToCreate: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { data: invitations } = useUserInvitations();

	const { actingId, handleAccept } = useInvitationActions({
		successMessage: t("invitations.accepted"),
		errorMessage: t("invitations.error"),
		onAcceptSuccess: onAccepted,
	});

	return (
		<Card className="w-full max-w-md" data-testid="onboarding-invitations">
			<CardHeader>
				<CardTitle>{t("invitations.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("invitations.description")}
				</p>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{invitations?.map((invitation) => (
					<InvitationCard
						key={invitation.id}
						orgName={invitation.organizationName}
						role={invitation.role}
						actions={
							<Button
								size="sm"
								onClick={() => handleAccept(invitation.id)}
								disabled={actingId !== null}
							>
								{t("invitations.accept")}
							</Button>
						}
					/>
				))}
				<Button
					variant="ghost"
					onClick={onSkipToCreate}
					data-testid="onboarding-create-instead"
				>
					{t("invitations.createInstead")}
				</Button>
			</CardContent>
		</Card>
	);
}
