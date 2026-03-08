import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useInvalidateOrg, useInvitation } from "@/hooks/use-org-queries";
import { authClient, requireAuth } from "@/lib/auth-client";

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

	const acceptMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId: invitation?.id,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success(t("invitations.acceptSuccess"));
			invalidateUserInvitations();
			navigate({ to: "/org" });
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || t("invitations.error"));
		},
	});

	const rejectMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.organization.rejectInvitation({
				invitationId: invitation?.id,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success(t("invitations.rejectSuccess"));
			invalidateUserInvitations();
			navigate({ to: "/dashboard" });
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || t("invitations.error"));
		},
	});

	const acting = acceptMutation.isPending || rejectMutation.isPending;

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
							<Button onClick={() => acceptMutation.mutate()} disabled={acting}>
								{t("invitations.accept")}
							</Button>
							<Button
								variant="outline"
								onClick={() => rejectMutation.mutate()}
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
