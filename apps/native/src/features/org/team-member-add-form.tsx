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
import { inputThemed, sharedStyles } from "@/styles/shared";

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
				style={[sharedStyles.input, { flex: 1 }, inputThemed(theme)]}
				value={email}
				onChangeText={setEmail}
				placeholder={t("invitations.emailPlaceholder")}
				placeholderTextColor={theme.border}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TouchableOpacity
				style={[styles.addButton, { backgroundColor: theme.primary }]}
				onPress={() => {
					if (!email.trim()) return;
					handleAdd(teamId, members ?? []);
				}}
				disabled={loading || !email.trim()}
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
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
});
