import { useTranslation } from "@pengana/i18n";
import { Alert, ScrollView } from "react-native";

import { Container } from "@/components/container";
import { LoadingScreen } from "@/components/loading-screen";
import { InviteForm } from "@/features/org/invite-form";
import { OrgInvitationsList } from "@/features/org/org-invitations-list";
import { UserInvitationsList } from "@/features/org/user-invitations-list";
import { useInvitationMutations } from "@/hooks/use-invitation-mutations";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { sharedStyles } from "@/styles/shared";

export default function InvitationsScreen() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const { acceptMutation, rejectMutation, cancelMutation, isPendingFor } =
		useInvitationMutations();

	if (isPending) return <LoadingScreen />;

	const invitations = activeOrg?.invitations || [];

	const handleCancel = (invitationId: string) => {
		if (isPendingFor(invitationId)) return;
		Alert.alert(t("invitations.cancel"), "", [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("common:confirm.yes"),
				onPress: () => cancelMutation.mutate(invitationId),
			},
		]);
	};

	return (
		<Container>
			<ScrollView contentContainerStyle={sharedStyles.listContainer}>
				{activeOrg && isAdmin && <InviteForm orgId={activeOrg.id} />}

				{activeOrg && (
					<OrgInvitationsList
						invitations={invitations}
						isAdmin={isAdmin}
						isPendingFor={isPendingFor}
						onCancel={handleCancel}
					/>
				)}

				<UserInvitationsList
					isPendingFor={isPendingFor}
					acceptMutation={acceptMutation}
					rejectMutation={rejectMutation}
				/>
			</ScrollView>
		</Container>
	);
}
