import { useTranslation } from "@pengana/i18n";
import { makeAddMemberSchema } from "@pengana/i18n/zod";
import { useTeamMemberAdd, useZodForm } from "@pengana/org-client";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

export function TeamMemberAddForm({
	teamId,
	members,
}: {
	teamId: string;
	members: Array<{ userId: string; user: { email: string } }> | undefined;
}) {
	const { i18n, t } = useTranslation("organization");

	return (
		<TeamMemberAddFormContent
			key={i18n.language}
			teamId={teamId}
			members={members}
			t={t}
		/>
	);
}

function TeamMemberAddFormContent({
	teamId,
	members,
	t,
}: {
	teamId: string;
	members: Array<{ userId: string; user: { email: string } }> | undefined;
	t: ReturnType<typeof useTranslation<"organization">>["t"];
}) {
	const { theme } = useTheme();

	const { handleAdd, loading } = useTeamMemberAdd({
		onSuccess: () => Alert.alert("", t("teams.addMemberSuccess")),
		onError: (message) =>
			Alert.alert(t("common:error.title"), message || t("teams.error")),
	});

	const form = useZodForm({
		schema: makeAddMemberSchema(t),
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			const success = await handleAdd(teamId, members ?? [], value.email);
			if (success) form.reset();
		},
	});

	return (
		<View style={styles.addRow}>
			<form.Field name="email">
				{(field) => (
					<ThemedTextInput
						style={{ flex: 1 }}
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder={t("invitations.emailPlaceholder")}
						keyboardType="email-address"
						autoCapitalize="none"
						error={field.state.meta.errors[0]?.message}
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
						disabled={loading || isSubmitting || !email.trim() || !members}
					>
						{loading ? (
							<ActivityIndicator color={TEXT_ON_PRIMARY} size="small" />
						) : (
							<Text style={{ color: TEXT_ON_PRIMARY }}>
								{t("teams.addMember")}
							</Text>
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
