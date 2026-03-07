import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
	const [invitation, setInvitation] = useState<{
		id: string;
		organizationName: string;
		organizationSlug: string;
		inviterEmail: string;
		email: string;
		role: string;
		status: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [acting, setActing] = useState(false);

	useEffect(() => {
		authClient.organization
			.getInvitation({ query: { id: invitationId } })
			.then(({ data }) => {
				if (data) setInvitation(data);
			})
			.finally(() => setLoading(false));
	}, [invitationId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<p>{t("common:status.loading")}</p>
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

	const handleAccept = async () => {
		setActing(true);
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId: invitation.id,
			});
			if (error) {
				toast.error(error.message || t("invitations.error"));
				return;
			}
			toast.success(t("invitations.acceptSuccess"));
			navigate({ to: "/org" });
		} catch {
			toast.error(t("invitations.error"));
		} finally {
			setActing(false);
		}
	};

	const handleReject = async () => {
		setActing(true);
		try {
			const { error } = await authClient.organization.rejectInvitation({
				invitationId: invitation.id,
			});
			if (error) {
				toast.error(error.message || t("invitations.error"));
				return;
			}
			toast.success(t("invitations.rejectSuccess"));
			navigate({ to: "/dashboard" });
		} catch {
			toast.error(t("invitations.error"));
		} finally {
			setActing(false);
		}
	};

	const isPending = invitation.status === "pending";

	return (
		<div className="flex items-center justify-center p-8">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{t("invitations.title")}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 text-xs">
					<p>
						You have been invited to join{" "}
						<strong>{invitation.organizationName}</strong> as{" "}
						<strong>{invitation.role}</strong>.
					</p>
					<p className="text-muted-foreground">
						Invited by: {invitation.inviterEmail}
					</p>
					{isPending ? (
						<div className="flex gap-2">
							<Button onClick={handleAccept} disabled={acting}>
								{t("invitations.accept")}
							</Button>
							<Button
								variant="outline"
								onClick={handleReject}
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
