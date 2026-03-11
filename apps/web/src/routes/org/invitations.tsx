import { useTranslation } from "@pengana/i18n";
import { useCancelInvitation } from "@pengana/org-client";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useOrgGuard } from "@/components/org-guard";
import { InviteMemberForm } from "@/features/org-management/invite-member-form";
import { OrgInvitationsTable } from "@/features/org-management/org-invitations-table";
import { UserInvitationsTable } from "@/features/org-management/user-invitations-table";
import { useOrgRole, useUserInvitations } from "@/hooks/use-org-queries";

export const Route = createFileRoute("/org/invitations")({
	component: InvitationsPage,
});

function InvitationsPage() {
	const { t } = useTranslation("organization");
	const { isAdmin } = useOrgRole();
	const { data: myInvitations } = useUserInvitations();

	const { handleCancel, cancellingId } = useCancelInvitation({
		onSuccess: () => toast.success(t("invitations.cancelSuccess")),
		onError: (message) => toast.error(message || t("invitations.error")),
	});

	const pendingUserInvitations = (myInvitations ?? []).filter(
		(i) => i.status === "pending",
	);

	const { activeOrg, guardElement } = useOrgGuard();
	if (guardElement || !activeOrg) return guardElement;

	const invitations = activeOrg?.invitations || [];

	return (
		<div className="flex flex-col gap-6">
			{isAdmin && <InviteMemberForm organizationId={activeOrg?.id} />}
			<OrgInvitationsTable
				invitations={invitations}
				isAdmin={isAdmin}
				onCancel={handleCancel}
				cancellingId={cancellingId}
			/>
			<UserInvitationsTable invitations={pendingUserInvitations} />
		</div>
	);
}
