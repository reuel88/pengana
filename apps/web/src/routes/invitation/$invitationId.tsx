import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useInvitationActions } from "@/shared/hooks/use-invitation-actions";
import {
	useInvalidateOrg,
	useInvitation,
} from "@/shared/hooks/use-org-queries";
import { requireAuth } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/invitation/$invitationId")({
	component: InvitationPage,
	beforeLoad: async () => {
		const { session } = await requireAuth();
		return { session };
	},
});

function InvitationPage() {
	const { invitationId } = Route.useParams();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { invalidateUserInvitations } = useInvalidateOrg();

	const {
		data: invitation,
		isPending,
		isError,
		refetch,
	} = useInvitation(invitationId);

	const { actingId, handleAccept, handleReject } = useInvitationActions({
		successMessage: t("invitations.acceptSuccess"),
		errorMessage: t("invitations.error"),
		rejectSuccessMessage: t("invitations.rejectSuccess"),
		onAcceptSuccess: async () => {
			await invalidateUserInvitations();
			navigate({ to: "/org" });
		},
		onRejectSuccess: async () => {
			await invalidateUserInvitations();
			navigate({ to: "/" });
		},
	});

	const acting = actingId !== null;

	if (isPending) {
		return (
			<div className="flex items-center justify-center p-8">
				<p>{t("common:status.loading")}</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 p-8">
				<p className="text-muted-foreground">{t("invitations.fetchError")}</p>
				<Button variant="outline" onClick={() => refetch()}>
					{t("invitations.retry")}
				</Button>
			</div>
		);
	}

	if (!invitation) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground">
					{t("invitations.noInvitations")}
				</p>
			</div>
		);
	}

	const isInvitationPending = invitation.status === "pending";

	return (
		<div className="flex items-center justify-center p-8">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{t("invitations.title")}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 text-xs">
					<p>
						{t("invitations.invitedAs", {
							org: invitation.organizationName,
							role: t(`roles.${invitation.role}`),
						})}
					</p>
					<p className="text-muted-foreground">
						{t("invitations.invitedBy", {
							email: invitation.inviterEmail,
						})}
					</p>
					{isInvitationPending ? (
						<div className="flex gap-2">
							<Button
								onClick={() => handleAccept(invitation.id)}
								disabled={acting}
							>
								{t("invitations.accept")}
							</Button>
							<Button
								variant="outline"
								onClick={() => handleReject(invitation.id)}
								disabled={acting}
							>
								{t("invitations.reject")}
							</Button>
						</div>
					) : (
						<p className="text-muted-foreground">
							{t(`invitations.status.${invitation.status}`)}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
