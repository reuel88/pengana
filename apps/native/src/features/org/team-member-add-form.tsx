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
import { z } from "zod";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTheme } from "@/lib/theme";
import { inputThemed, sharedStyles } from "@/styles/shared";

const addMemberSchema = z.object({
	email: z.string().email(),
});

export function TeamMemberAddForm({
	teamId,
	members,
}: {
	teamId: string;
	members: Array<{ userId: string; user: { email: string } }> | undefined;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const { handleAdd, loading } = useTeamMemberAdd({
		onSuccess: () => Alert.alert("", t("teams.addMemberSuccess")),
		onError: (message) =>
			Alert.alert(t("common:error.title"), message || t("teams.error")),
	});

	const form = useZodForm({
		schema: addMemberSchema,
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			await handleAdd(teamId, members ?? [], value.email);
			form.reset();
		},
	});

	return (
		<View style={styles.addRow}>
			<form.Field name="email">
				{(field) => (
					<TextInput
						style={[sharedStyles.input, { flex: 1 }, inputThemed(theme)]}
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder={t("invitations.emailPlaceholder")}
						placeholderTextColor={theme.border}
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				)}
			</form.Field>
			<form.Subscribe
				selector={(s) => ({
					isSubmitting: s.isSubmitting,
					email: s.values.email,
				})}
			>
				{({ isSubmitting, email }) => (
					<TouchableOpacity
						style={[styles.addButton, { backgroundColor: theme.primary }]}
						onPress={form.handleSubmit}
						disabled={loading || isSubmitting || !email.trim()}
					>
						{loading ? (
							<ActivityIndicator color="#fff" size="small" />
						) : (
							<Text style={{ color: "#fff" }}>{t("teams.addMember")}</Text>
						)}
					</TouchableOpacity>
				)}
			</form.Subscribe>
		</View>
	);
}

const styles = StyleSheet.create({
	addRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
});
