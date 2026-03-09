import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";

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
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>{t("invitations.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("invitations.description")}
				</p>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{invitations?.map((invitation) => (
					<div
						key={invitation.id}
						className="flex items-center justify-between rounded-md border p-3"
					>
						<div className="flex flex-col gap-0.5">
							<span className="font-medium text-sm">
								{invitation.organizationName}
							</span>
							<span className="text-muted-foreground text-xs">
								{invitation.role}
							</span>
						</div>
						<Button
							size="sm"
							onClick={() => handleAccept(invitation.id)}
							disabled={actingId !== null}
						>
							{t("invitations.accept")}
						</Button>
					</div>
				))}
				<Button variant="ghost" onClick={onSkipToCreate}>
					{t("invitations.createInstead")}
				</Button>
			</CardContent>
		</Card>
	);
}
