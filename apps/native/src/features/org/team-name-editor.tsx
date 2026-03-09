import { useTranslation } from "@pengana/i18n";
import { useTeamNameEditor } from "@pengana/org-client";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useOrgRole } from "@/hooks/use-org-role";
import { useTheme } from "@/lib/theme";

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
					style={[
						styles.input,
						{ flex: 1, color: theme.text, borderColor: theme.border },
					]}
					value={newName}
					onChangeText={setNewName}
				/>
				<TouchableOpacity
					style={[styles.addButton, { backgroundColor: theme.primary }]}
					onPress={() => handleSave(teamId, orgId)}
					disabled={loading || !trimmedName}
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

const styles = StyleSheet.create({
	title: { fontSize: 18, fontWeight: "bold" },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
	editNameRow: {
		flex: 1,
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
		marginRight: 8,
	},
	cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
});
