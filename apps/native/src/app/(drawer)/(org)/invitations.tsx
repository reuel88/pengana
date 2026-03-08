import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
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
import { useInvitationMutations } from "@/hooks/use-invitation-mutations";
import { useActiveOrg, useUserInvitations } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";
import { useTheme } from "@/lib/theme";

function InviteForm({ orgId }: { orgId: string }) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin">("member");
	const [loading, setLoading] = useState(false);

	const handleInvite = () => {
		if (!email) return;
		return authMutation({
			mutationFn: () =>
				authClient.organization.inviteMember({
					email,
					role,
					organizationId: orgId,
				}),
			successMessage: t("invitations.sendSuccess"),
			errorMessage: t("invitations.error"),
			onSuccess: () => {
				setEmail("");
			},
			setLoading,
		});
	};

	return (
		<View style={styles.inviteForm}>
			<TextInput
				style={[styles.input, { color: theme.text, borderColor: theme.border }]}
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
								role === "member" ? `${theme.primary}30` : "transparent",
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
								role === "admin" ? `${theme.primary}30` : "transparent",
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
	);
}

function OrgInvitationsList({
	invitations,
	isPendingFor,
	onCancel,
}: {
	invitations: Array<{
		id: string;
		email: string;
		role: string;
		status: string;
	}>;
	isPendingFor: (id: string) => boolean;
	onCancel: (id: string) => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { isAdmin } = useOrgRole();

	return (
		<>
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
								{t(`roles.${inv.role}`)} -{" "}
								{t(`invitations.status.${inv.status}`)}
							</Text>
						</View>
						{isAdmin && inv.status === "pending" && (
							<TouchableOpacity
								onPress={() => onCancel(inv.id)}
								disabled={isPendingFor(inv.id)}
								style={[
									styles.cancelButton,
									{ borderColor: theme.border },
									isPendingFor(inv.id) && { opacity: 0.5 },
								]}
							>
								<Text style={{ color: theme.text, fontSize: 12 }}>
									{t("invitations.cancel")}
								</Text>
							</TouchableOpacity>
						)}
					</View>
				))
			)}
		</>
	);
}

function UserInvitationsList({
	isPendingFor,
	acceptMutation,
	rejectMutation,
}: {
	isPendingFor: (id: string) => boolean;
	acceptMutation: ReturnType<typeof useInvitationMutations>["acceptMutation"];
	rejectMutation: ReturnType<typeof useInvitationMutations>["rejectMutation"];
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
				<Text style={{ color: theme.text, opacity: 0.5 }}>
					{t("common:status.loading")}
				</Text>
			) : myInvitationsError ? (
				<View style={{ gap: 8 }}>
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("invitations.fetchError")}
					</Text>
					<TouchableOpacity
						style={[styles.acceptButton, { backgroundColor: theme.primary }]}
						onPress={() => refetchMyInvitations()}
					>
						<Text style={{ color: "#fff", fontSize: 12 }}>
							{t("invitations.retry")}
						</Text>
					</TouchableOpacity>
				</View>
			) : pendingUserInvitations.length === 0 ? (
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
							<Text style={{ color: theme.text }}>{inv.organizationName}</Text>
							<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
								{t(`roles.${inv.role}`)}
							</Text>
						</View>
						<View style={styles.actionRow}>
							<TouchableOpacity
								onPress={() => acceptMutation.mutate(inv.id)}
								disabled={isPendingFor(inv.id)}
								style={[
									styles.acceptButton,
									{ backgroundColor: theme.primary },
									isPendingFor(inv.id) && { opacity: 0.5 },
								]}
							>
								<Text style={{ color: "#fff", fontSize: 12 }}>
									{t("invitations.accept")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => rejectMutation.mutate(inv.id)}
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

export default function InvitationsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const { acceptMutation, rejectMutation, cancelMutation, isPendingFor } =
		useInvitationMutations();

	if (isPending) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

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
