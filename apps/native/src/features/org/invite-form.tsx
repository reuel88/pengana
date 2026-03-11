import { useTranslation } from "@pengana/i18n";
import { useInviteMember, useZodForm } from "@pengana/org-client";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";

import { RoleToggle } from "@/components/role-toggle";
import { ThemedTextInput } from "@/components/themed-text-input";
import { useTheme } from "@/lib/theme";
import { sharedStyles } from "@/styles/shared";

const inviteSchema = z.object({
	email: z.string().email(),
	role: z.enum(["member", "admin"]),
});

export function InviteForm({ orgId }: { orgId: string }) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const { inviteMember, loading } = useInviteMember({
		onSuccess: () => Alert.alert("", t("invitations.sendSuccess")),
		onError: (message) => Alert.alert("", message || t("invitations.error")),
	});

	const form = useZodForm({
		schema: inviteSchema,
		defaultValues: { email: "", role: "member" as "member" | "admin" },
		onSubmit: async ({ value }) => {
			await inviteMember({ ...value, organizationId: orgId });
			form.reset();
		},
	});

	return (
		<View style={styles.inviteForm}>
			<form.Field name="email">
				{(field) => (
					<ThemedTextInput
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder={t("invitations.emailPlaceholder")}
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				)}
			</form.Field>
			<form.Field name="role">
				{(field) => (
					<RoleToggle
						role={field.state.value}
						onChange={field.handleChange}
						disabled={loading}
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
						style={[sharedStyles.button, { backgroundColor: theme.primary }]}
						onPress={form.handleSubmit}
						disabled={loading || isSubmitting || !email}
					>
						<Text style={sharedStyles.buttonText}>
							{loading ? t("common:submitting") : t("invitations.send")}
						</Text>
					</TouchableOpacity>
				)}
			</form.Subscribe>
		</View>
	);
}

const styles = StyleSheet.create({
	inviteForm: { gap: 12, marginBottom: 16 },
});
