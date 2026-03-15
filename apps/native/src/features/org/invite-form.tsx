import { useTranslation } from "@pengana/i18n";
import { makeNativeInviteSchema } from "@pengana/i18n/zod";
import { useInviteMember, useZodForm } from "@pengana/org-client";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import { withLanguageKey } from "@/shared/lib/with-language-key";
import {
	primaryButton,
	primaryButtonText,
	sharedStyles,
} from "@/shared/styles/shared";
import { RoleToggle } from "@/shared/ui/role-toggle";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

export const InviteForm = withLanguageKey(InviteFormContent);

function InviteFormContent({ orgId }: { orgId: string }) {
	const { t } = useTranslation("organization");
	const { theme } = useTheme();

	const { inviteMember, loading } = useInviteMember({
		onSuccess: () => Alert.alert("", t("invitations.sendSuccess")),
		onError: (message) => Alert.alert("", message || t("invitations.error")),
	});

	const form = useZodForm({
		schema: makeNativeInviteSchema(t),
		defaultValues: { email: "", role: "member" as "member" | "admin" },
		onSubmit: async ({ value }) => {
			const success = await inviteMember({ ...value, organizationId: orgId });
			if (success) {
				form.reset();
			}
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
						error={field.state.meta.errors[0]?.message}
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
						style={[sharedStyles.button, primaryButton(theme)]}
						onPress={form.handleSubmit}
						disabled={loading || isSubmitting || !email}
					>
						<Text style={primaryButtonText(theme)}>
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
