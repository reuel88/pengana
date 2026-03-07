import { useTranslation } from "@pengana/i18n";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

interface TeamMemberItem {
	id: string;
	teamId: string;
	userId: string;
	createdAt: Date;
}

export default function TeamDetailScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { teamId } = useLocalSearchParams<{ teamId: string }>();
	const router = useRouter();
	const { data: activeOrg } = authClient.useActiveOrganization();
	const { isAdmin } = useOrgRole();
	const [teamName, setTeamName] = useState("");
	const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [memberEmail, setMemberEmail] = useState("");
	const [editingName, setEditingName] = useState(false);
	const [newName, setNewName] = useState("");
	const [savingName, setSavingName] = useState(false);

	const loadData = () => {
		if (!teamId) return;
		const promises = [
			authClient.organization.listTeams().then(({ data }) => {
				const found = (
					data as Array<{ id: string; name: string }> | undefined
				)?.find((t) => t.id === teamId);
				if (found) setTeamName(found.name);
			}),
			authClient.organization
				.listTeamMembers({ query: { teamId } })
				.then(({ data }) => {
					if (data) setTeamMembers(data);
				}),
		];
		Promise.all(promises).finally(() => setLoading(false));
	};

	useEffect(() => {
		if (!activeOrg || !teamId) return;
		loadData();
	}, [activeOrg, teamId]);

	if (loading) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

	if (!teamName || !activeOrg) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
					{t("noActiveOrg")}
				</Text>
			</Container>
		);
	}

	const handleAddMember = async () => {
		if (!memberEmail) return;
		const member = activeOrg.members?.find((m) => m.user.email === memberEmail);
		if (!member) {
			Alert.alert(t("teams.error"));
			return;
		}
		const { error } = await authClient.organization.addTeamMember({
			teamId: teamId!,
			userId: member.userId,
		});
		if (error) {
			Alert.alert(t("teams.error"), error.message);
			return;
		}
		setMemberEmail("");
		authClient.organization
			.listTeamMembers({ query: { teamId: teamId! } })
			.then(({ data }) => {
				if (data) setTeamMembers(data);
			});
	};

	const handleRemoveMember = (userId: string) => {
		Alert.alert(t("teams.removeMember"), "", [
			{ text: "Cancel", style: "cancel" },
			{
				text: t("teams.removeMember"),
				style: "destructive",
				onPress: async () => {
					const { error } = await authClient.organization.removeTeamMember({
						teamId: teamId!,
						userId,
					});
					if (error) {
						Alert.alert(t("teams.error"), error.message);
						return;
					}
					authClient.organization
						.listTeamMembers({ query: { teamId: teamId! } })
						.then(({ data }) => {
							if (data) setTeamMembers(data);
						});
				},
			},
		]);
	};

	const handleDelete = () => {
		Alert.alert(t("teams.delete"), t("teams.deleteConfirm"), [
			{ text: "Cancel", style: "cancel" },
			{
				text: t("teams.delete"),
				style: "destructive",
				onPress: async () => {
					const { error } = await authClient.organization.removeTeam({
						teamId: teamId!,
					});
					if (error) {
						Alert.alert(t("teams.error"), error.message);
						return;
					}
					router.back();
				},
			},
		]);
	};

	const handleUpdateName = async () => {
		setSavingName(true);
		try {
			const { error } = await authClient.organization.updateTeam({
				teamId: teamId!,
				data: { name: newName },
			});
			if (error) {
				Alert.alert(t("teams.error"), error.message);
				return;
			}
			Alert.alert(t("teams.updateNameSuccess"));
			setTeamName(newName);
			setEditingName(false);
		} catch {
			Alert.alert(t("teams.error"));
		} finally {
			setSavingName(false);
		}
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
							{isAdmin && editingName ? (
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
										style={[
											styles.addButton,
											{ backgroundColor: theme.primary },
										]}
										onPress={handleUpdateName}
										disabled={savingName}
									>
										<Text style={{ color: "#fff", fontSize: 12 }}>
											{t("teams.updateName")}
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.cancelBtn, { borderColor: theme.border }]}
										onPress={() => setEditingName(false)}
									>
										<Text style={{ color: theme.text, fontSize: 12 }}>
											{t("invitations.cancel")}
										</Text>
									</TouchableOpacity>
								</View>
							) : (
								<TouchableOpacity
									onLongPress={() => {
										if (isAdmin) {
											setNewName(teamName);
											setEditingName(true);
										}
									}}
								>
									<Text style={[styles.title, { color: theme.text }]}>
										{teamName}
									</Text>
								</TouchableOpacity>
							)}
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
						)}
					</>
				}
				ListEmptyComponent={
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("teams.noMembers")}
					</Text>
				}
				renderItem={({ item: tm }) => {
					const orgMember = activeOrg.members?.find(
						(m) => m.userId === tm.userId,
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
									{orgMember?.user.name ?? tm.userId}
								</Text>
								<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
									{orgMember?.user.email ?? ""}
								</Text>
							</View>
							{isAdmin && (
								<TouchableOpacity
									onPress={() => handleRemoveMember(tm.userId)}
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
