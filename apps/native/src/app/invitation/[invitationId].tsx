import { useTranslation } from "@pengana/i18n";
import { useInvitationActions } from "@pengana/org-client";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useInvitation } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { useTheme } from "@/shared/lib/theme";
import { mutedText, secondaryText, sharedStyles } from "@/shared/styles/shared";
import { Container } from "@/shared/ui/container";

export default function InvitationScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
	const router = useRouter();
	const { data: session, isPending: sessionPending } = authClient.useSession();

	const { actingId, handleAccept, handleReject } = useInvitationActions({
		onAcceptSuccess: () => router.replace("/(drawer)/(org)"),
		onRejectSuccess: () => router.replace("/"),
		onError: (msg) => Alert.alert(t("invitations.error"), msg),
	});

	const {
		data: invitation,
		isPending: loading,
		isError: fetchError,
		refetch,
	} = useInvitation(invitationId ?? "");

	const acting = invitation ? actingId === invitation.id : false;

	if (sessionPending) {
		return null;
	}

	if (!session) {
		return <Redirect href="/" />;
	}

	if (loading) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

	if (fetchError) {
		return (
			<Container>
				<View style={{ padding: 16, gap: 12 }}>
					<Text style={mutedText(theme)}>{t("invitations.fetchError")}</Text>
					<TouchableOpacity
						style={[styles.acceptButton, { backgroundColor: theme.primary }]}
						onPress={() => refetch()}
						accessibilityRole="button"
						accessibilityLabel={t("invitations.retry")}
					>
						<Text style={sharedStyles.buttonText}>
							{t("invitations.retry")}
						</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	if (!invitation) {
		return (
			<Container>
				<Text style={[{ padding: 16 }, mutedText(theme)]}>
					{t("invitations.noInvitations")}
				</Text>
			</Container>
		);
	}

	const isPending = invitation.status === "pending";

	return (
		<Container>
			<View style={styles.content}>
				<View
					style={[
						styles.card,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<Text style={[styles.title, { color: theme.text }]}>
						{t("invitations.title")}
					</Text>
					<Text style={{ color: theme.text, marginTop: 8 }}>
						{t("invitations.invitedAs", {
							org: invitation.organizationName,
							role: t(`roles.${invitation.role}`),
						})}
					</Text>
					<Text style={[secondaryText(theme), { marginTop: 4 }]}>
						{t("invitations.invitedBy", { email: invitation.inviterEmail })}
					</Text>

					{isPending ? (
						<View style={styles.actions}>
							<TouchableOpacity
								style={[
									styles.acceptButton,
									{ backgroundColor: theme.primary },
								]}
								onPress={() =>
									handleAccept(invitation.id, invitation.organizationId)
								}
								disabled={acting}
								accessibilityRole="button"
								accessibilityLabel={t("invitations.accept")}
								accessibilityState={{ disabled: acting, busy: acting }}
							>
								<Text style={sharedStyles.buttonText}>
									{t("invitations.accept")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.rejectButton, { borderColor: theme.border }]}
								onPress={() => handleReject(invitation.id)}
								disabled={acting}
								accessibilityRole="button"
								accessibilityLabel={t("invitations.reject")}
								accessibilityState={{ disabled: acting, busy: acting }}
							>
								<Text style={{ color: theme.text }}>
									{t("invitations.reject")}
								</Text>
							</TouchableOpacity>
						</View>
					) : (
						<Text style={[mutedText(theme), { marginTop: 12 }]}>
							{t(`invitations.status.${invitation.status}`)}
						</Text>
					)}
				</View>
			</View>
		</Container>
	);
}

const styles = StyleSheet.create({
	content: { flex: 1, justifyContent: "center", padding: 16 },
	card: { padding: 20, borderWidth: 1 },
	title: { fontSize: 18, fontWeight: "bold" },
	actions: { flexDirection: "row", gap: 12, marginTop: 16 },
	acceptButton: { flex: 1, padding: 12, alignItems: "center" },
	rejectButton: { flex: 1, padding: 12, alignItems: "center", borderWidth: 1 },
});
