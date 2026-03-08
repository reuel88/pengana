import { useTranslation } from "@pengana/i18n";
import { Alert, ScrollView, StyleSheet } from "react-native";

import { Container } from "@/components/container";
import { LoadingScreen } from "@/components/loading-screen";
import { InviteForm } from "@/features/org/invite-form";
import { OrgInvitationsList } from "@/features/org/org-invitations-list";
import { UserInvitationsList } from "@/features/org/user-invitations-list";
import { useInvitationMutations } from "@/hooks/use-invitation-mutations";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";

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
			{ text: t("common:confirm.no"), style: "cancel" },
			{
				text: t("common:confirm.yes"),
				onPress: () => cancelMutation.mutate(invitationId),
			},
		]);
	};

	return (
		<Container>
			<ScrollView contentContainerStyle={styles.list}>
				{activeOrg && isAdmin && <InviteForm orgId={activeOrg.id} />}

				{activeOrg && (
					<OrgInvitationsList
						invitations={invitations}
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

const styles = StyleSheet.create({
	list: { padding: 16, gap: 8 },
});
