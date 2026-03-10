import { useTranslation } from "@pengana/i18n";
import { useBatchInvite, useZodForm } from "@pengana/org-client";
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
import { RoleToggle } from "@/components/role-toggle";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useTheme } from "@/lib/theme";

import { onboardingStyles } from "./onboarding-styles";

const inviteMembersSchema = z.object({
	members: z.array(
		z.object({
			email: z.string(),
			role: z.enum(["member", "admin"]),
		}),
	),
});

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { theme } = useTheme();
	const { data: activeOrg } = useActiveOrg();

	const { batchInvite, loading } = useBatchInvite({
		organizationId: activeOrg?.id,
		onSuccess: () => onInvited(),
		onPartialFailure: () => Alert.alert(t("invite.error")),
		onError: () => Alert.alert(t("invite.error")),
	});

	const form = useZodForm({
		schema: inviteMembersSchema,
		defaultValues: {
			members: [{ email: "", role: "member" as "member" | "admin" }],
		},
		onSubmit: async ({ value }) => {
			const valid = value.members.filter((m) => m.email.trim());
			await batchInvite(valid);
		},
	});

	return (
		<View
			style={[
				onboardingStyles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[onboardingStyles.title, { color: theme.text }]}>
				{t("invite.title")}
			</Text>
			<Text
				style={[
					onboardingStyles.description,
					{ color: theme.text, opacity: 0.6 },
				]}
			>
				{t("invite.description")}
			</Text>

			<form.Field name="members" mode="array">
				{(membersField) => (
					<>
						{membersField.state.value.map((_entry, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: array index is stable for invite rows
							<View key={index} style={styles.entryRow}>
								<form.Field name={`members[${index}].email`}>
									{(emailField) => (
										<TextInput
											style={[
												styles.emailInput,
												{
													color: theme.text,
													borderColor: theme.border,
													backgroundColor: theme.background,
												},
											]}
											value={emailField.state.value as string}
											onChangeText={emailField.handleChange}
											placeholder={t("invite.emailPlaceholder")}
											placeholderTextColor={theme.border}
											keyboardType="email-address"
											autoCapitalize="none"
										/>
									)}
								</form.Field>
								<form.Field name={`members[${index}].role`}>
									{(roleField) => (
										<RoleToggle
											role={roleField.state.value as "member" | "admin"}
											onChange={(role) => roleField.handleChange(role)}
											disabled={loading}
										/>
									)}
								</form.Field>
								{membersField.state.value.length > 1 && (
									<TouchableOpacity
										style={styles.removeButton}
										onPress={() => form.removeFieldValue("members", index)}
									>
										<Text style={{ color: theme.notification, fontSize: 12 }}>
											{t("invite.remove")}
										</Text>
									</TouchableOpacity>
								)}
							</View>
						))}
					</>
				)}
			</form.Field>

			<TouchableOpacity
				style={[styles.outlineButton, { borderColor: theme.border }]}
				onPress={() =>
					form.pushFieldValue("members", {
						email: "",
						role: "member" as const,
					})
				}
			>
				<Text style={[styles.outlineButtonText, { color: theme.text }]}>
					{t("invite.addAnother")}
				</Text>
			</TouchableOpacity>

			<form.Subscribe
				selector={(s): [boolean, boolean] => [
					s.isSubmitting,
					!s.values.members.some((m) => m.email.trim()),
				]}
			>
				{([isSubmitting, noValid]) => (
					<TouchableOpacity
						style={[
							onboardingStyles.submitButton,
							{
								backgroundColor: theme.primary,
								opacity:
									isSubmitting || loading || !activeOrg?.id || noValid
										? 0.5
										: 1,
							},
						]}
						onPress={form.handleSubmit}
						disabled={isSubmitting || loading || !activeOrg?.id || noValid}
					>
						{loading ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text style={onboardingStyles.submitButtonText}>
								{t("invite.send")}
							</Text>
						)}
					</TouchableOpacity>
				)}
			</form.Subscribe>

			<TouchableOpacity style={onboardingStyles.ghostButton} onPress={onSkip}>
				<Text
					style={[onboardingStyles.ghostButtonText, { color: theme.primary }]}
				>
					{t("invite.skip")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	entryRow: {
		marginBottom: 12,
	},
	emailInput: {
		borderWidth: 1,
		padding: 12,
		fontSize: 14,
		marginBottom: 8,
	},
	removeButton: {
		paddingVertical: 4,
		alignItems: "flex-end",
	},
	outlineButton: {
		padding: 12,
		alignItems: "center",
		borderWidth: 1,
		marginBottom: 8,
	},
	outlineButtonText: {
		fontSize: 14,
	},
});
