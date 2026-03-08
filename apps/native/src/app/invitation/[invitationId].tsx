import { useTranslation } from "@pengana/i18n";
import { useMutation } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Container } from "@/components/container";
import { useInvalidateOrg, useInvitation } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function InvitationScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
	const router = useRouter();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { invalidateUserInvitations } = useInvalidateOrg();

	const {
		data: invitation,
		isPending: loading,
		isError: fetchError,
		refetch,
	} = useInvitation(invitationId ?? "");

	const acceptMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId: invitation?.id,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			Alert.alert(t("invitations.acceptSuccess"));
			invalidateUserInvitations();
			router.replace("/(drawer)/(org)");
		},
		onError: (error: { message?: string }) => {
			Alert.alert(t("invitations.error"), error.message);
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
			Alert.alert(t("invitations.rejectSuccess"));
			invalidateUserInvitations();
			router.replace("/");
		},
		onError: (error: { message?: string }) => {
			Alert.alert(t("invitations.error"), error.message);
		},
	});

	const acting = acceptMutation.isPending || rejectMutation.isPending;

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
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("invitations.fetchError")}
					</Text>
					<TouchableOpacity
						style={[styles.acceptButton, { backgroundColor: theme.primary }]}
						onPress={() => refetch()}
					>
						<Text style={{ color: "#fff", fontWeight: "bold" }}>
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
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
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
					<Text
						style={{
							color: theme.text,
							opacity: 0.7,
							marginTop: 4,
							fontSize: 12,
						}}
					>
						{t("invitations.invitedBy", { email: invitation.inviterEmail })}
					</Text>

					{isPending ? (
						<View style={styles.actions}>
							<TouchableOpacity
								style={[
									styles.acceptButton,
									{ backgroundColor: theme.primary },
								]}
								onPress={() => acceptMutation.mutate()}
								disabled={acting}
							>
								<Text style={{ color: "#fff", fontWeight: "bold" }}>
									{t("invitations.accept")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.rejectButton, { borderColor: theme.border }]}
								onPress={() => rejectMutation.mutate()}
								disabled={acting}
							>
								<Text style={{ color: theme.text }}>
									{t("invitations.reject")}
								</Text>
							</TouchableOpacity>
						</View>
					) : (
						<Text style={{ color: theme.text, opacity: 0.5, marginTop: 12 }}>
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
