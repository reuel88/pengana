import { useTranslation } from "@pengana/i18n";
import { useEffect, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

interface UserInvitation {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: string;
}

export default function InvitationsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin">("member");
	const [loading, setLoading] = useState(false);
	const { isAdmin } = useOrgRole();
	const [myInvitations, setMyInvitations] = useState<UserInvitation[]>([]);

	useEffect(() => {
		authClient.organization.listUserInvitations().then(({ data }) => {
			if (data) setMyInvitations(data as UserInvitation[]);
		});
	}, []);

	if (isPending) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

	if (!activeOrg) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
					{t("noActiveOrg")}
				</Text>
			</Container>
		);
	}

	const invitations = activeOrg.invitations || [];
	const pendingUserInvitations = myInvitations.filter(
		(i) => i.status === "pending",
	);

	const handleInvite = async () => {
		if (!email) return;
		setLoading(true);
		try {
			const { error } = await authClient.organization.inviteMember({
				email,
				role,
				organizationId: activeOrg.id,
			});
			if (error) {
				Alert.alert(t("invitations.error"), error.message);
				return;
			}
			Alert.alert(t("invitations.sendSuccess"));
			setEmail("");
		} catch {
			Alert.alert(t("invitations.error"));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = (invitationId: string) => {
		Alert.alert(t("invitations.cancel"), "", [
			{ text: "No", style: "cancel" },
			{
				text: "Yes",
				onPress: async () => {
					const { error } = await authClient.organization.cancelInvitation({
						invitationId,
					});
					if (error) Alert.alert(t("invitations.error"), error.message);
				},
			},
		]);
	};

	const handleAccept = async (invitationId: string) => {
		const { error } = await authClient.organization.acceptInvitation({
			invitationId,
		});
		if (error) {
			Alert.alert(t("invitations.error"), error.message);
			return;
		}
		Alert.alert(t("invitations.acceptSuccess"));
		setMyInvitations((prev) => prev.filter((i) => i.id !== invitationId));
	};

	const handleReject = async (invitationId: string) => {
		const { error } = await authClient.organization.rejectInvitation({
			invitationId,
		});
		if (error) {
			Alert.alert(t("invitations.error"), error.message);
			return;
		}
		Alert.alert(t("invitations.rejectSuccess"));
		setMyInvitations((prev) => prev.filter((i) => i.id !== invitationId));
	};

	return (
		<Container>
			<ScrollView contentContainerStyle={styles.list}>
				{isAdmin && (
					<View style={styles.inviteForm}>
						<TextInput
							style={[
								styles.input,
								{ color: theme.text, borderColor: theme.border },
							]}
							value={email}
							onChangeText={setEmail}
							placeholder={t("invitations.emailPlaceholder")}
							placeholderTextColor={theme.border}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
						<View style={styles.roleRow}>
							<TouchableOpacity
								style={[
									styles.roleButton,
									{
										borderColor: theme.border,
										backgroundColor:
											role === "member" ? theme.primary + "30" : "transparent",
									},
								]}
								onPress={() => setRole("member")}
							>
								<Text style={{ color: theme.text }}>{t("roles.member")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.roleButton,
									{
										borderColor: theme.border,
										backgroundColor:
											role === "admin" ? theme.primary + "30" : "transparent",
									},
								]}
								onPress={() => setRole("admin")}
							>
								<Text style={{ color: theme.text }}>{t("roles.admin")}</Text>
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							style={[styles.button, { backgroundColor: theme.primary }]}
							onPress={handleInvite}
							disabled={loading || !email}
						>
							<Text style={styles.buttonText}>
								{loading ? t("common:submitting") : t("invitations.send")}
							</Text>
						</TouchableOpacity>
					</View>
				)}

				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					{t("invitations.pending")}
				</Text>
				{invitations.length === 0 ? (
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("invitations.noPending")}
					</Text>
				) : (
					invitations.map((inv) => (
						<View
							key={inv.id}
							style={[
								styles.invItem,
								{ borderColor: theme.border, backgroundColor: theme.card },
							]}
						>
							<View style={{ flex: 1 }}>
								<Text style={{ color: theme.text }}>{inv.email}</Text>
								<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
									{inv.role} - {t(`invitations.status.${inv.status}`)}
								</Text>
							</View>
							{isAdmin && inv.status === "pending" && (
								<TouchableOpacity
									onPress={() => handleCancel(inv.id)}
									style={[styles.cancelButton, { borderColor: theme.border }]}
								>
									<Text style={{ color: theme.text, fontSize: 12 }}>
										{t("invitations.cancel")}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					))
				)}

				<Text
					style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}
				>
					{t("invitations.myInvitations")}
				</Text>
				{pendingUserInvitations.length === 0 ? (
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("invitations.noInvitations")}
					</Text>
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
								<Text style={{ color: theme.text }}>{inv.organizationId}</Text>
								<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
									{inv.role}
								</Text>
							</View>
							<View style={styles.actionRow}>
								<TouchableOpacity
									onPress={() => handleAccept(inv.id)}
									style={[
										styles.acceptButton,
										{ backgroundColor: theme.primary },
									]}
								>
									<Text style={{ color: "#fff", fontSize: 12 }}>
										{t("invitations.accept")}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => handleReject(inv.id)}
									style={[styles.cancelButton, { borderColor: theme.border }]}
								>
									<Text style={{ color: theme.text, fontSize: 12 }}>
										{t("invitations.reject")}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					))
				)}
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	list: { padding: 16, gap: 8 },
	inviteForm: { gap: 12, marginBottom: 16 },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	roleRow: { flexDirection: "row", gap: 8 },
	roleButton: { flex: 1, padding: 10, borderWidth: 1, alignItems: "center" },
	button: { padding: 12, alignItems: "center" },
	buttonText: { color: "#fff", fontWeight: "bold" },
	invItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	cancelButton: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
	acceptButton: { paddingHorizontal: 12, paddingVertical: 6 },
	actionRow: { flexDirection: "row", gap: 6 },
	sectionTitle: { fontSize: 14, fontWeight: "bold" },
});
