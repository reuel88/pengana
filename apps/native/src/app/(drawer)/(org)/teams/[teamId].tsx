import { useTranslation } from "@pengana/i18n";
import { useTeamActions } from "@pengana/org-client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { TeamMemberAddForm } from "@/features/org/team-member-add-form";
import { TeamMemberRow } from "@/features/org/team-member-row";
import { TeamNameEditor } from "@/features/org/team-name-editor";
import {
	useActiveOrg,
	useOrgRole,
	useTeamMembers,
	useTeams,
} from "@/shared/hooks/use-org-queries";
import { useTheme } from "@/shared/lib/theme";
import {
	mutedText,
	sharedStyles,
	smallPrimaryButtonText,
} from "@/shared/styles/shared";
import { Container } from "@/shared/ui/container";
import { EmptyOrgScreen } from "@/shared/ui/empty-org-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";

export default function TeamDetailScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { teamId } = useLocalSearchParams<{ teamId: string }>();
	const router = useRouter();
	const { data: activeOrg, isPending: isOrgPending } = useActiveOrg();
	const { isAdmin } = useOrgRole();

	const { data: teams = [], isPending: isTeamsPending } = useTeams(
		activeOrg?.id,
	);
	const { data: teamMembers = [], isPending: isMembersPending } =
		useTeamMembers(teamId);

	const { handleDeleteTeam, handleRemoveMember } = useTeamActions({
		onDeleteSuccess: () => router.back(),
		onRemoveMemberSuccess: () =>
			Alert.alert("", t("teams.removeMemberSuccess")),
		onError: (message) => Alert.alert("", message || t("teams.error")),
	});

	const team = teams.find((item) => item.id === teamId);
	const teamName = team?.name ?? "";

	const membersByUserId = useMemo(() => {
		const members = activeOrg?.members ?? [];
		const map = new Map<string, (typeof members)[number]>();
		for (const m of members) {
			map.set(m.userId, m);
		}
		return map;
	}, [activeOrg?.members]);

	if (isOrgPending || isTeamsPending || isMembersPending)
		return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;
	if (!teamId || !teamName) {
		return (
			<Container>
				<Text style={[styles.notFoundText, mutedText(theme)]}>
					{t("teams.notFound")}
				</Text>
			</Container>
		);
	}

	const onRemoveMember = (userId: string) => {
		Alert.alert(t("teams.removeMember"), "", [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("teams.removeMember"),
				style: "destructive",
				onPress: () => handleRemoveMember(teamId, userId),
			},
		]);
	};

	const onDelete = () => {
		Alert.alert(t("teams.delete"), t("teams.deleteConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("teams.delete"),
				style: "destructive",
				onPress: () => handleDeleteTeam(teamId, activeOrg.id),
			},
		]);
	};

	return (
		<Container>
			<FlatList
				data={teamMembers}
				keyExtractor={(item) => item.id}
				contentContainerStyle={sharedStyles.listContainer}
				ListHeaderComponent={
					<>
						<View style={styles.header}>
							<TeamNameEditor
								teamId={teamId}
								teamName={teamName}
								orgId={activeOrg.id}
								isAdmin={isAdmin}
							/>
							{isAdmin && (
								<TouchableOpacity
									style={[
										styles.deleteButton,
										{ backgroundColor: theme.notification },
									]}
									onPress={onDelete}
								>
									<Text style={smallPrimaryButtonText(theme)}>
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
					<Text style={mutedText(theme)}>{t("teams.noMembers")}</Text>
				}
				renderItem={({ item }) => {
					const orgMember = membersByUserId.get(item.userId);
					return (
						<TeamMemberRow
							name={orgMember?.user.name ?? item.userId}
							email={orgMember?.user.email ?? ""}
							isAdmin={isAdmin}
							onRemove={isAdmin ? () => onRemoveMember(item.userId) : undefined}
						/>
					);
				}}
			/>
		</Container>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	deleteButton: { paddingHorizontal: 12, paddingVertical: 6 },
	notFoundText: { padding: 16 },
});
