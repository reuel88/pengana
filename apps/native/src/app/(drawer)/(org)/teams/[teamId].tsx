import { useTranslation } from "@pengana/i18n";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import {
	useActiveOrg,
	useInvalidateOrg,
	useTeamMembers,
	useTeams,
} from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";
import { useTheme } from "@/lib/theme";

function TeamNameEditor({
	teamId,
	teamName,
	orgId,
	theme,
}: {
	teamId: string;
	teamName: string;
	orgId: string;
	theme: ReturnType<typeof useTheme>["theme"];
}) {
	const { t } = useTranslation("organization");
	const { isAdmin } = useOrgRole();
	const { invalidateTeams } = useInvalidateOrg();
	const [editing, setEditing] = useState(false);
	const [newName, setNewName] = useState("");
	const [saving, setSaving] = useState(false);

	const handleUpdateName = () =>
		authMutation({
			mutationFn: () =>
				authClient.organization.updateTeam({
					teamId,
					data: { name: newName },
				}),
			successMessage: t("teams.updateNameSuccess"),
			errorMessage: t("teams.error"),
			onSuccess: () => {
				invalidateTeams(orgId);
				setEditing(false);
			},
			setLoading: setSaving,
		});

	if (isAdmin && editing) {
		return (
			<View style={styles.editNameRow}>
				<TextInput
					style={[
						styles.input,
						{ flex: 1, color: theme.text, borderColor: theme.border },
					]}
					value={newName}
					onChangeText={setNewName}
				/>
				<TouchableOpacity
					style={[styles.addButton, { backgroundColor: theme.primary }]}
					onPress={handleUpdateName}
					disabled={saving}
				>
					<Text style={{ color: "#fff", fontSize: 12 }}>
						{t("teams.updateName")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.cancelBtn, { borderColor: theme.border }]}
					onPress={() => setEditing(false)}
				>
					<Text style={{ color: theme.text, fontSize: 12 }}>
						{t("common:confirm.cancel")}
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<TouchableOpacity
			onLongPress={() => {
				if (isAdmin) {
					setNewName(teamName);
					setEditing(true);
				}
			}}
		>
			<Text style={[styles.title, { color: theme.text }]}>{teamName}</Text>
		</TouchableOpacity>
	);
}

function TeamMemberAddForm({
	teamId,
	members,
	theme,
}: {
	teamId: string;
	members: Array<{ userId: string; user: { email: string } }> | undefined;
	theme: ReturnType<typeof useTheme>["theme"];
}) {
	const { t } = useTranslation("organization");
	const { invalidateTeamMembers } = useInvalidateOrg();
	const [memberEmail, setMemberEmail] = useState("");

	const handleAddMember = async () => {
		if (!memberEmail) return;
		const member = members?.find((m) => m.user.email === memberEmail);
		if (!member) {
			Alert.alert(t("teams.error"));
			return;
		}
		await authMutation({
			mutationFn: () =>
				authClient.organization.addTeamMember({
					teamId,
					userId: member.userId,
				}),
			errorMessage: t("teams.error"),
			onSuccess: () => {
				setMemberEmail("");
				invalidateTeamMembers(teamId);
			},
		});
	};

	return (
		<View style={styles.addRow}>
			<TextInput
				style={[
					styles.input,
					{ flex: 1, color: theme.text, borderColor: theme.border },
				]}
				value={memberEmail}
				onChangeText={setMemberEmail}
				placeholder={t("invitations.emailPlaceholder")}
				placeholderTextColor={theme.border}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TouchableOpacity
				style={[styles.addButton, { backgroundColor: theme.primary }]}
				onPress={handleAddMember}
			>
				<Text style={{ color: "#fff" }}>{t("teams.addMember")}</Text>
			</TouchableOpacity>
		</View>
	);
}

export default function TeamDetailScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { teamId } = useLocalSearchParams<{ teamId: string }>();
	const router = useRouter();
	const { data: activeOrg } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const { invalidateTeams, invalidateTeamMembers } = useInvalidateOrg();

	const { data: teams = [] } = useTeams(activeOrg?.id);
	const { data: teamMembers = [], isPending: loading } = useTeamMembers(teamId);

	const team = teams.find((item) => item.id === teamId);
	const teamName = team?.name ?? "";

	if (loading) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

	if (!teamId || !teamName || !activeOrg) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
					{t("noActiveOrg")}
				</Text>
			</Container>
		);
	}

	const handleRemoveMember = (userId: string) => {
		Alert.alert(t("teams.removeMember"), "", [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("teams.removeMember"),
				style: "destructive",
				onPress: () =>
					authMutation({
						mutationFn: () =>
							authClient.organization.removeTeamMember({ teamId, userId }),
						errorMessage: t("teams.error"),
						onSuccess: () => invalidateTeamMembers(teamId),
					}),
			},
		]);
	};

	const handleDelete = () => {
		Alert.alert(t("teams.delete"), t("teams.deleteConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("teams.delete"),
				style: "destructive",
				onPress: () =>
					authMutation({
						mutationFn: () => authClient.organization.removeTeam({ teamId }),
						errorMessage: t("teams.error"),
						onSuccess: () => {
							invalidateTeams(activeOrg.id);
							router.back();
						},
					}),
			},
		]);
	};

	return (
		<Container>
			<FlatList
				data={teamMembers}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				ListHeaderComponent={
					<>
						<View style={styles.header}>
							<TeamNameEditor
								teamId={teamId}
								teamName={teamName}
								orgId={activeOrg.id}
								theme={theme}
							/>
							{isAdmin && (
								<TouchableOpacity
									style={[
										styles.deleteButton,
										{ backgroundColor: theme.notification },
									]}
									onPress={handleDelete}
								>
									<Text style={{ color: "#fff", fontSize: 12 }}>
										{t("teams.delete")}
									</Text>
								</TouchableOpacity>
							)}
						</View>
						{isAdmin && (
							<TeamMemberAddForm
								teamId={teamId}
								members={activeOrg.members}
								theme={theme}
							/>
						)}
					</>
				}
				ListEmptyComponent={
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("teams.noMembers")}
					</Text>
				}
				renderItem={({ item }) => {
					const orgMember = activeOrg.members?.find(
						(m) => m.userId === item.userId,
					);
					return (
						<View
							style={[
								styles.memberItem,
								{ borderColor: theme.border, backgroundColor: theme.card },
							]}
						>
							<View style={{ flex: 1 }}>
								<Text style={{ color: theme.text }}>
									{orgMember?.user.name ?? item.userId}
								</Text>
								<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
									{orgMember?.user.email ?? ""}
								</Text>
							</View>
							{isAdmin && (
								<TouchableOpacity
									onPress={() => handleRemoveMember(item.userId)}
									style={[
										styles.removeButton,
										{ backgroundColor: theme.notification },
									]}
								>
									<Text style={{ color: "#fff", fontSize: 12 }}>
										{t("teams.removeMember")}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					);
				}}
			/>
		</Container>
	);
}

const styles = StyleSheet.create({
	list: { padding: 16, gap: 8 },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	title: { fontSize: 18, fontWeight: "bold" },
	deleteButton: { paddingHorizontal: 12, paddingVertical: 6 },
	addRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
	memberItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
	editNameRow: {
		flex: 1,
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
		marginRight: 8,
	},
	cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
});
