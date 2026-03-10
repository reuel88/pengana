import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@pengana/i18n";
import {
	teamNameSchema,
	useTeamNameEditor,
	useZodForm,
} from "@pengana/org-client";
import { useState } from "react";
import {
	Alert,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useTheme } from "@/lib/theme";
import { inputThemed, sharedStyles } from "@/styles/shared";

export function TeamNameEditor({
	teamId,
	teamName,
	orgId,
	isAdmin,
}: {
	teamId: string;
	teamName: string;
	orgId: string;
	isAdmin: boolean;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const [editing, setEditing] = useState(false);

	const { handleSave, loading } = useTeamNameEditor({
		onSuccess: () => {
			Alert.alert("", t("teams.updateNameSuccess"));
			setEditing(false);
		},
		onError: (message) => Alert.alert("", message || t("teams.error")),
	});

	const form = useZodForm({
		schema: teamNameSchema,
		defaultValues: { name: teamName },
		onSubmit: async ({ value }) => {
			await handleSave(teamId, orgId, value.name);
		},
	});

	if (isAdmin && editing) {
		return (
			<View style={styles.editNameRow}>
				<form.Field name="name">
					{(field) => (
						<TextInput
							style={[sharedStyles.input, { flex: 1 }, inputThemed(theme)]}
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				</form.Field>
				<form.Subscribe
					selector={(s) => ({
						isSubmitting: s.isSubmitting,
						name: s.values.name,
					})}
				>
					{({ isSubmitting, name }) => (
						<TouchableOpacity
							style={[styles.saveButton, { backgroundColor: theme.primary }]}
							onPress={form.handleSubmit}
							disabled={loading || isSubmitting || !name.trim()}
						>
							<Text style={sharedStyles.smallButtonText}>
								{t("teams.updateName")}
							</Text>
						</TouchableOpacity>
					)}
				</form.Subscribe>
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
						form.reset({ name: teamName });
						setEditing(true);
					}}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
	saveButton: { paddingHorizontal: 16, justifyContent: "center" },
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
