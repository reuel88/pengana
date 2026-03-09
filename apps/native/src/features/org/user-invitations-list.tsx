import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useUserInvitations } from "@/hooks/use-org-queries";
import { useTheme } from "@/lib/theme";
import { mutedText, secondaryText, sharedStyles } from "@/styles/shared";

export function UserInvitationsList({
	isPendingFor,
	onAccept,
	onReject,
}: {
	isPendingFor: (id: string) => boolean;
	onAccept: (id: string) => void;
	onReject: (id: string) => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const {
		data: myInvitations,
		isPending: myInvitationsLoading,
		isError: myInvitationsError,
		refetch: refetchMyInvitations,
	} = useUserInvitations();

	const pendingUserInvitations = (myInvitations ?? []).filter(
		(i) => i.status === "pending",
	);

	return (
		<>
			<Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>
				{t("invitations.myInvitations")}
			</Text>
			{myInvitationsLoading ? (
				<Text style={mutedText(theme)}>{t("common:status.loading")}</Text>
			) : myInvitationsError ? (
				<View style={{ gap: 8 }}>
					<Text style={mutedText(theme)}>{t("invitations.fetchError")}</Text>
					<TouchableOpacity
						style={[styles.acceptButton, { backgroundColor: theme.primary }]}
						onPress={() => refetchMyInvitations()}
					>
						<Text style={sharedStyles.smallButtonText}>
							{t("invitations.retry")}
						</Text>
					</TouchableOpacity>
				</View>
			) : pendingUserInvitations.length === 0 ? (
				<Text style={mutedText(theme)}>{t("invitations.noInvitations")}</Text>
			) : (
				pendingUserInvitations.map((inv) => (
					<View
						key={inv.id}
						style={[
							styles.invItem,
							{ borderColor: theme.border, backgroundColor: theme.card },
						]}
					>
						<View style={{ flex: 1 }}>
							<Text style={{ color: theme.text }}>{inv.organizationName}</Text>
							<Text style={secondaryText(theme)}>{t(`roles.${inv.role}`)}</Text>
						</View>
						<View style={styles.actionRow}>
							<TouchableOpacity
								onPress={() => onAccept(inv.id)}
								disabled={isPendingFor(inv.id)}
								style={[
									styles.acceptButton,
									{ backgroundColor: theme.primary },
									isPendingFor(inv.id) && { opacity: 0.5 },
								]}
							>
								<Text style={sharedStyles.smallButtonText}>
									{t("invitations.accept")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => onReject(inv.id)}
								disabled={isPendingFor(inv.id)}
								style={[
									styles.cancelButton,
									{ borderColor: theme.border },
									isPendingFor(inv.id) && { opacity: 0.5 },
								]}
							>
								<Text style={{ color: theme.text, fontSize: 12 }}>
									{t("invitations.reject")}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				))
			)}
		</>
	);
}

const styles = StyleSheet.create({
	sectionTitle: { fontSize: 14, fontWeight: "bold" },
	invItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	cancelButton: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
	acceptButton: { paddingHorizontal: 12, paddingVertical: 6 },
	actionRow: { flexDirection: "row", gap: 6 },
});
