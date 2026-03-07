import { useTranslation } from "@pengana/i18n";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function InvitationScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
	const router = useRouter();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [invitation, setInvitation] = useState<{
		id: string;
		organizationName: string;
		inviterEmail: string;
		role: string;
		status: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [acting, setActing] = useState(false);

	useEffect(() => {
		if (!invitationId) return;
		authClient.organization
			.getInvitation({ query: { id: invitationId } })
			.then(({ data }) => {
				if (data) setInvitation(data);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [invitationId]);

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

	if (!invitation) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
					{t("invitations.noInvitations")}
				</Text>
			</Container>
		);
	}

	const handleAccept = async () => {
		setActing(true);
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId: invitation.id,
			});
			if (error) {
				Alert.alert(t("invitations.error"), error.message);
				return;
			}
			Alert.alert(t("invitations.acceptSuccess"));
			router.replace("/(drawer)/(org)");
		} catch {
			Alert.alert(t("invitations.error"));
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
				Alert.alert(t("invitations.error"), error.message);
				return;
			}
			Alert.alert(t("invitations.rejectSuccess"));
			router.replace("/");
		} catch {
			Alert.alert(t("invitations.error"));
		} finally {
			setActing(false);
		}
	};

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
								onPress={handleAccept}
								disabled={acting}
							>
								<Text style={{ color: "#fff", fontWeight: "bold" }}>
									{t("invitations.accept")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.rejectButton, { borderColor: theme.border }]}
								onPress={handleReject}
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
