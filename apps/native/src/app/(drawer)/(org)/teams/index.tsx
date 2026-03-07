import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
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

export default function TeamsIndexScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
	const [teamsLoading, setTeamsLoading] = useState(true);
	const [teamName, setTeamName] = useState("");
	const [creating, setCreating] = useState(false);
	const { isAdmin } = useOrgRole();

	useEffect(() => {
		if (!activeOrg) return;
		authClient.organization
			.listTeams({ query: { organizationId: activeOrg.id } })
			.then(({ data }) => {
				if (data) setTeams(data);
			})
			.finally(() => setTeamsLoading(false));
	}, [activeOrg]);

	if (isPending || teamsLoading) {
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

	const handleCreate = async () => {
		if (!teamName) return;
		setCreating(true);
		try {
			const { data, error } = await authClient.organization.createTeam({
				name: teamName,
				organizationId: activeOrg.id,
			});
			if (error) {
				Alert.alert(t("teams.error"), error.message);
				return;
			}
			if (data) setTeams((prev) => [...prev, data]);
			setTeamName("");
		} catch {
			Alert.alert(t("teams.error"));
		} finally {
			setCreating(false);
		}
	};

	return (
		<Container>
			<FlatList
				data={teams}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				ListHeaderComponent={
					isAdmin ? (
						<View style={styles.createRow}>
							<TextInput
								style={[
									styles.input,
									{ flex: 1, color: theme.text, borderColor: theme.border },
								]}
								value={teamName}
								onChangeText={setTeamName}
								placeholder={t("teams.namePlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TouchableOpacity
								style={[
									styles.createButton,
									{ backgroundColor: theme.primary },
								]}
								onPress={handleCreate}
								disabled={creating || !teamName}
							>
								<Text style={{ color: "#fff" }}>{t("teams.create")}</Text>
							</TouchableOpacity>
						</View>
					) : null
				}
				ListEmptyComponent={
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("teams.noTeams")}
					</Text>
				}
				renderItem={({ item: team }) => (
					<TouchableOpacity
						style={[
							styles.teamItem,
							{ borderColor: theme.border, backgroundColor: theme.card },
						]}
						onPress={() =>
							router.push(`/(drawer)/(org)/teams/${team.id}` as any)
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
	list: { padding: 16, gap: 8 },
	createRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	createButton: { paddingHorizontal: 16, justifyContent: "center" },
	teamItem: { padding: 14, borderWidth: 1 },
});
