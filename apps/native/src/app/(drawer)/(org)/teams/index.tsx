import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { EmptyOrgScreen } from "@/components/empty-org-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { ThemedTextInput } from "@/components/themed-text-input";
import {
	useActiveOrg,
	useInvalidateOrg,
	useOrgRole,
	useTeams,
} from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";
import { TEXT_ON_PRIMARY } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";
import { mutedText, sharedStyles } from "@/styles/shared";

export default function TeamsIndexScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = useActiveOrg();
	const { data: teams = [], isPending: teamsLoading } = useTeams(activeOrg?.id);
	const [teamName, setTeamName] = useState("");
	const [creating, setCreating] = useState(false);
	const { isAdmin } = useOrgRole();
	const { invalidateTeams } = useInvalidateOrg();

	if (isPending || teamsLoading) return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;

	const handleCreate = () => {
		const trimmed = teamName.trim();
		if (!trimmed) return;
		return authMutation({
			mutationFn: () =>
				authClient.organization.createTeam({
					name: trimmed,
					organizationId: activeOrg.id,
				}),
			errorMessage: t("teams.error"),
			onSuccess: () => {
				invalidateTeams(activeOrg.id);
				setTeamName("");
			},
			setLoading: setCreating,
		});
	};

	return (
		<Container>
			<FlatList
				data={teams}
				keyExtractor={(item) => item.id}
				contentContainerStyle={sharedStyles.listContainer}
				ListHeaderComponent={
					isAdmin ? (
						<View style={styles.createRow}>
							<ThemedTextInput
								style={{ flex: 1 }}
								value={teamName}
								onChangeText={setTeamName}
								placeholder={t("teams.namePlaceholder")}
							/>
							<TouchableOpacity
								style={[
									styles.createButton,
									{ backgroundColor: theme.primary },
								]}
								onPress={handleCreate}
								disabled={creating || !teamName.trim()}
							>
								<Text style={{ color: TEXT_ON_PRIMARY }}>
									{t("teams.create")}
								</Text>
							</TouchableOpacity>
						</View>
					) : null
				}
				ListEmptyComponent={
					<Text style={mutedText(theme)}>{t("teams.noTeams")}</Text>
				}
				renderItem={({ item: team }) => (
					<TouchableOpacity
						style={[
							styles.teamItem,
							{ borderColor: theme.border, backgroundColor: theme.card },
						]}
						onPress={() =>
							router.push(`/(drawer)/(org)/teams/${team.id}` as never)
						}
					>
						<Text style={{ color: theme.text }}>{team.name}</Text>
					</TouchableOpacity>
				)}
			/>
		</Container>
	);
}

const styles = StyleSheet.create({
	createRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
	createButton: { paddingHorizontal: 16, justifyContent: "center" },
	teamItem: { padding: 14, borderWidth: 1 },
});
