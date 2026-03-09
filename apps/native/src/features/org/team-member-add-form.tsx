import { useTranslation } from "@pengana/i18n";
import { useTeamMemberAdd } from "@pengana/org-client";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useTheme } from "@/lib/theme";

export function TeamMemberAddForm({
	teamId,
	members,
}: {
	teamId: string;
	members: Array<{ userId: string; user: { email: string } }> | undefined;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const { email, setEmail, handleAdd, loading } = useTeamMemberAdd({
		onSuccess: () => Alert.alert("", t("teams.addMemberSuccess")),
		onError: (message) =>
			Alert.alert(t("common:error.title"), message || t("teams.error")),
	});

	return (
		<View style={styles.addRow}>
			<TextInput
				style={[
					styles.input,
					{ flex: 1, color: theme.text, borderColor: theme.border },
				]}
				value={email}
				onChangeText={setEmail}
				placeholder={t("invitations.emailPlaceholder")}
				placeholderTextColor={theme.border}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TouchableOpacity
				style={[styles.addButton, { backgroundColor: theme.primary }]}
				onPress={() => handleAdd(teamId, members ?? [])}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color="#fff" size="small" />
				) : (
					<Text style={{ color: "#fff" }}>{t("teams.addMember")}</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	addRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
});
