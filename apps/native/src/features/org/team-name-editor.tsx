import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@pengana/i18n";
import { useTeamNameEditor } from "@pengana/org-client";
import {
	Alert,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useOrgRole } from "@/hooks/use-org-role";
import { useTheme } from "@/lib/theme";
import { inputThemed, sharedStyles } from "@/styles/shared";

export function TeamNameEditor({
	teamId,
	teamName,
	orgId,
}: {
	teamId: string;
	teamName: string;
	orgId: string;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { isAdmin } = useOrgRole();

	const { editing, setEditing, newName, setNewName, handleSave, loading } =
		useTeamNameEditor({
			onSuccess: () => Alert.alert("", t("teams.updateNameSuccess")),
			onError: (message) => Alert.alert("", message || t("teams.error")),
		});

	const trimmedName = newName.trim();

	if (isAdmin && editing) {
		return (
			<View style={styles.editNameRow}>
				<TextInput
					style={[sharedStyles.input, { flex: 1 }, inputThemed(theme)]}
					value={newName}
					onChangeText={setNewName}
				/>
				<TouchableOpacity
					style={[styles.addButton, { backgroundColor: theme.primary }]}
					onPress={() => handleSave(teamId, orgId)}
					disabled={loading || !trimmedName}
				>
					<Text style={sharedStyles.smallButtonText}>
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

	if (isAdmin) {
		return (
			<View style={styles.nameRow}>
				<Text style={[styles.title, { color: theme.text }]}>{teamName}</Text>
				<Pressable
					onPress={() => {
						setNewName(teamName);
						setEditing(true);
					}}
					accessibilityLabel={t("teams.rename")}
					accessibilityRole="button"
				>
					<View style={{ opacity: 0.5 }}>
						<Ionicons name="create-outline" size={20} color={theme.text} />
					</View>
				</Pressable>
			</View>
		);
	}

	return <Text style={[styles.title, { color: theme.text }]}>{teamName}</Text>;
}

const styles = StyleSheet.create({
	title: { fontSize: 18, fontWeight: "bold" },
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
	editNameRow: {
		flex: 1,
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
		marginRight: 8,
	},
	cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
	nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
