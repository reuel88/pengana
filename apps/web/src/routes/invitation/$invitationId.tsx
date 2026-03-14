import { useTranslation } from "@pengana/i18n";
import { Button, buttonVariants } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { orpc } from "@/shared/api/orpc";
import { useInvitationActions } from "@/shared/hooks/use-invitation-actions";
import {
	useInvalidateOrg,
	useInvitation,
} from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/invitation/$invitationId")({
	component: InvitationPage,
});

function InvitationPage() {
	const { invitationId } = Route.useParams();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { invalidateUserInvitations } = useInvalidateOrg();
	const summaryQuery = useQuery(
		orpc.invitationSummary.queryOptions({ input: { invitationId } }),
	);

	const {
		data: invitation,
		isPending,
		isError,
		refetch,
	} = useInvitation(invitationId, { enabled: !!session });

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

	if (sessionPending) {
		return (
			<div className="flex items-center justify-center p-8">
				<p>{t("common:status.loading")}</p>
			</div>
		);
	}

	if (!session) {
		if (summaryQuery.isPending) {
			return (
				<div className="flex items-center justify-center p-8">
					<p>{t("common:status.loading")}</p>
				</div>
			);
		}

		if (summaryQuery.isError) {
			return (
				<div className="flex flex-col items-center justify-center gap-3 p-8">
					<p className="text-muted-foreground">{t("invitations.fetchError")}</p>
					<Button variant="outline" onClick={() => summaryQuery.refetch()}>
						{t("invitations.retry")}
					</Button>
				</div>
			);
		}

		if (!summaryQuery.data?.data) {
			return (
				<div className="flex flex-col items-center justify-center gap-3 p-8">
					<p className="text-muted-foreground">{t("invitations.notFound")}</p>
					<Link to="/" className={buttonVariants({ variant: "outline" })}>
						{t("common:nav.home", { defaultValue: "Home" })}
					</Link>
				</div>
			);
		}

		const summary = summaryQuery.data.data;
		const isExpired = new Date(summary.expiresAt) < new Date();
		const isActionable = summary.status === "pending" && !isExpired;

		return (
			<div className="flex items-center justify-center p-8">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>{t("invitations.title")}</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 text-xs">
						<p>
							{t("invitations.invitedAs", {
								org: summary.organizationName,
								role: t(`roles.${summary.role ?? "member"}`),
							})}
						</p>
						<p className="text-muted-foreground">
							{t("invitations.invitedBy", {
								name: summary.inviterName,
							})}
						</p>
						{isActionable ? (
							<div className="flex gap-2">
								<Link
									to="/login"
									search={{ invitationId }}
									className={buttonVariants({ variant: "default" })}
								>
									{t("common:user.signIn")}
								</Link>
								<Link
									to="/sign-up"
									search={{ invitationId }}
									className={buttonVariants({ variant: "outline" })}
								>
									{t("auth:signUp.submit")}
								</Link>
							</div>
						) : (
							<p className="text-muted-foreground">
								{t(
									`invitations.status.${isExpired ? "expired" : summary.status}`,
								)}
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		);
	}

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
								onClick={() =>
									handleAccept(invitation.id, invitation.organizationId)
								}
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
