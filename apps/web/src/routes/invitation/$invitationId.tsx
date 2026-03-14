import { useTranslation } from "@pengana/i18n";
import type { UserInvitation } from "@pengana/org-client";
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

function CenteredMessage({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-center p-8">
			<p className="text-muted-foreground">{children}</p>
		</div>
	);
}

function ErrorWithRetry({
	message,
	onRetry,
	retryLabel,
}: {
	message: string;
	onRetry: () => void;
	retryLabel: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 p-8">
			<p className="text-muted-foreground">{message}</p>
			<Button variant="outline" onClick={onRetry}>
				{retryLabel}
			</Button>
		</div>
	);
}

function InvitationDetailCard({
	orgName,
	role,
	inviterName,
	isActionable,
	statusLabel,
	actions,
}: {
	orgName: string;
	role: string;
	inviterName: string;
	isActionable: boolean;
	statusLabel: string;
	actions: React.ReactNode;
}) {
	const { t } = useTranslation("organization");

	return (
		<div className="flex items-center justify-center p-8">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{t("invitations.title")}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 text-xs">
					<p>
						{t("invitations.invitedAs", {
							org: orgName,
							role: t(`roles.${role}`),
						})}
					</p>
					<p className="text-muted-foreground">
						{t("invitations.invitedBy", { name: inviterName })}
					</p>
					{isActionable ? (
						actions
					) : (
						<p className="text-muted-foreground">{statusLabel}</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function UnauthenticatedInvitationView({
	invitationId,
}: {
	invitationId: string;
}) {
	const { t } = useTranslation("organization");
	const summaryQuery = useQuery(
		orpc.invitationSummary.queryOptions({ input: { invitationId } }),
	);

	if (summaryQuery.isPending) {
		return <CenteredMessage>{t("common:status.loading")}</CenteredMessage>;
	}

	if (summaryQuery.isError) {
		return (
			<ErrorWithRetry
				message={t("invitations.fetchError")}
				onRetry={() => summaryQuery.refetch()}
				retryLabel={t("invitations.retry")}
			/>
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
		<InvitationDetailCard
			orgName={summary.organizationName}
			role={summary.role ?? "member"}
			inviterName={summary.inviterName}
			isActionable={isActionable}
			statusLabel={t(
				`invitations.status.${isExpired ? "expired" : summary.status}`,
			)}
			actions={
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
			}
		/>
	);
}

function AuthenticatedInvitationView({
	invitation,
	acting,
	onAccept,
	onReject,
}: {
	invitation: UserInvitation;
	acting: boolean;
	onAccept: (id: string, organizationId: string) => void;
	onReject: (id: string) => void;
}) {
	const { t } = useTranslation("organization");

	return (
		<InvitationDetailCard
			orgName={invitation.organizationName}
			role={invitation.role}
			inviterName={invitation.inviterName ?? invitation.inviterEmail ?? ""}
			isActionable={invitation.status === "pending"}
			statusLabel={t(`invitations.status.${invitation.status}`)}
			actions={
				<div className="flex gap-2">
					<Button
						onClick={() => onAccept(invitation.id, invitation.organizationId)}
						disabled={acting}
					>
						{t("invitations.accept")}
					</Button>
					<Button
						variant="outline"
						onClick={() => onReject(invitation.id)}
						disabled={acting}
					>
						{t("invitations.reject")}
					</Button>
				</div>
			}
		/>
	);
}

function InvitationPage() {
	const { invitationId } = Route.useParams();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { invalidateUserInvitations } = useInvalidateOrg();

	const {
		data: invitation,
		isPending,
		isError,
		refetch,
	} = useInvitation(invitationId, { enabled: !!session });

	const { actingId, handleAccept, handleReject } = useInvitationActions({
		onAcceptSuccess: async () => {
			await invalidateUserInvitations();
			navigate({ to: "/org" });
		},
		onRejectSuccess: async () => {
			await invalidateUserInvitations();
			navigate({ to: "/" });
		},
	});

	if (sessionPending) {
		return <CenteredMessage>{t("common:status.loading")}</CenteredMessage>;
	}

	if (!session) {
		return <UnauthenticatedInvitationView invitationId={invitationId} />;
	}

	if (isPending) {
		return <CenteredMessage>{t("common:status.loading")}</CenteredMessage>;
	}

	if (isError) {
		return (
			<ErrorWithRetry
				message={t("invitations.fetchError")}
				onRetry={() => refetch()}
				retryLabel={t("invitations.retry")}
			/>
		);
	}

	if (!invitation) {
		return <CenteredMessage>{t("invitations.noInvitations")}</CenteredMessage>;
	}

	return (
		<AuthenticatedInvitationView
			invitation={invitation}
			acting={actingId !== null}
			onAccept={handleAccept}
			onReject={handleReject}
		/>
	);
}
