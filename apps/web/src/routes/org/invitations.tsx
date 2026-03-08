import { useTranslation } from "@pengana/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { InviteMemberForm } from "@/features/org-management/invite-member-form";
import { OrgInvitationsTable } from "@/features/org-management/org-invitations-table";
import { UserInvitationsTable } from "@/features/org-management/user-invitations-table";
import { useActiveOrg, useUserInvitations } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";

export const Route = createFileRoute("/org/invitations")({
	component: InvitationsPage,
});

function InvitationsPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const { data: myInvitations } = useUserInvitations();

	if (isPending) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const invitations = activeOrg.invitations || [];
	const pendingUserInvitations = (myInvitations ?? []).filter(
		(i) => i.status === "pending",
	);

	return (
		<div className="flex flex-col gap-6">
			{isAdmin && <InviteMemberForm organizationId={activeOrg.id} />}
			<OrgInvitationsTable invitations={invitations} isAdmin={isAdmin} />
			<UserInvitationsTable invitations={pendingUserInvitations} />
		</div>
	);
}
