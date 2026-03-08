import { useTranslation } from "@pengana/i18n";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { EmptyOrgScreen } from "@/components/empty-org-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { TeamMemberAddForm } from "@/features/org/team-member-add-form";
import { TeamNameEditor } from "@/features/org/team-name-editor";
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

	if (loading) return <LoadingScreen />;
	if (!teamId || !teamName || !activeOrg) return <EmptyOrgScreen />;

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
							<TeamMemberAddForm teamId={teamId} members={activeOrg.members} />
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
						(m: { userId: string; user: { name?: string } }) =>
							m.userId === item.userId,
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
	deleteButton: { paddingHorizontal: 12, paddingVertical: 6 },
	memberItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
});
