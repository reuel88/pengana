import { useTranslation } from "@pengana/i18n";
import { useZodForm } from "@pengana/org-client";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";
import { RoleToggle } from "@/components/role-toggle";
import { ThemedTextInput } from "@/components/themed-text-input";
import { useBatchInvite } from "@/hooks/use-batch-invite";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { TEXT_ON_PRIMARY } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";

import { onboardingStyles } from "./onboarding-styles";

const inviteMembersSchema = z.object({
	members: z.array(
		z.object({
			email: z.union([z.string().trim().email(), z.literal("")]),
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
			testID="onboarding-invite-members"
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
										<>
											<ThemedTextInput
												testID="invite-email-input"
												style={{
													backgroundColor: theme.background,
													marginBottom: 8,
												}}
												value={emailField.state.value as string}
												onChangeText={emailField.handleChange}
												placeholder={t("invite.emailPlaceholder")}
												keyboardType="email-address"
												autoCapitalize="none"
											/>
											{emailField.state.meta.errors.length > 0 && (
												<Text
													style={{
														color: theme.notification,
														fontSize: 12,
														marginTop: 4,
													}}
												>
													{emailField.state.meta.errors[0]?.message}
												</Text>
											)}
										</>
									)}
								</form.Field>
								<form.Field name={`members[${index}].role`}>
									{(roleField) => (
										<RoleToggle
											role={roleField.state.value as "member" | "admin"}
											onChange={(role) => roleField.handleChange(role)}
											disabled={loading}
											memberTestID="invite-role-input"
											adminTestID="invite-role-input"
										/>
									)}
								</form.Field>
								{membersField.state.value.length > 1 && (
									<TouchableOpacity
										style={styles.removeButton}
										onPress={() => form.removeFieldValue("members", index)}
										accessibilityRole="button"
										accessibilityLabel={t("invite.remove")}
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
				testID="invite-add-row"
				style={[styles.outlineButton, { borderColor: theme.border }]}
				onPress={() =>
					form.pushFieldValue("members", {
						email: "",
						role: "member" as const,
					})
				}
				accessibilityRole="button"
				accessibilityLabel={t("invite.addAnother")}
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
						testID="invite-submit"
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
						accessibilityRole="button"
						accessibilityLabel={t("invite.send")}
					>
						{loading ? (
							<ActivityIndicator size="small" color={TEXT_ON_PRIMARY} />
						) : (
							<Text style={onboardingStyles.submitButtonText}>
								{t("invite.send")}
							</Text>
						)}
					</TouchableOpacity>
				)}
			</form.Subscribe>

			<TouchableOpacity
				testID="invite-skip"
				style={onboardingStyles.ghostButton}
				onPress={onSkip}
				accessibilityRole="button"
				accessibilityLabel={t("invite.skip")}
			>
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
