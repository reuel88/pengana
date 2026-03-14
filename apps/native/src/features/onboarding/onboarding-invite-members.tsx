import { useTranslation } from "@pengana/i18n";
import { makeNativeInviteMembersSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useBatchInvite } from "@/shared/hooks/use-batch-invite";
import { useActiveOrg } from "@/shared/hooks/use-org-queries";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { RoleToggle } from "@/shared/ui/role-toggle";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

import { onboardingStyles } from "./onboarding-styles";

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");

	return (
		<OnboardingInviteMembersContent
			onInvited={onInvited}
			onSkip={onSkip}
			t={t}
		/>
	);
}

function OnboardingInviteMembersContent({
	onInvited,
	onSkip,
	t,
}: {
	onInvited: () => void;
	onSkip: () => void;
	t: ReturnType<typeof useTranslation<"onboarding">>["t"];
}) {
	const { theme } = useTheme();
	const { data: activeOrg } = useActiveOrg();

	const { batchInvite, loading } = useBatchInvite({
		organizationId: activeOrg?.id,
		onError: () => Alert.alert(t("invite.error")),
	});

	const form = useZodForm({
		schema: makeNativeInviteMembersSchema(t),
		defaultValues: {
			members: [{ email: "", role: "member" as "member" | "admin" }],
		},
		onSubmit: async ({ value }) => {
			const valid = value.members.filter((m) => m.email.trim());
			const result = await batchInvite(valid);
			if (!result || result.failures.length === 0) {
				onInvited();
				return;
			}
			if (result.successes.length === 0) {
				return;
			}

			Alert.alert(
				t("invite.error"),
				result.failures.map((failure) => failure.email).join("\n"),
			);
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
							// biome-ignore lint/suspicious/noArrayIndexKey: simple form list, not re-orderable
							<View key={index} style={styles.entryRow}>
								<form.Field name={`members[${index}].email`}>
									{(emailField) => (
										<ThemedTextInput
											testID={`invite-email-input-${index}`}
											style={{
												backgroundColor: theme.background,
												marginBottom: 8,
											}}
											value={emailField.state.value as string}
											onChangeText={emailField.handleChange}
											onBlur={emailField.handleBlur}
											label={t("invite.emailPlaceholder")}
											placeholder={t("invite.emailPlaceholder")}
											keyboardType="email-address"
											autoCapitalize="none"
											error={emailField.state.meta.errors[0]?.message}
										/>
									)}
								</form.Field>
								<form.Field name={`members[${index}].role`}>
									{(roleField) => (
										<RoleToggle
											role={roleField.state.value as "member" | "admin"}
											onChange={(role) => roleField.handleChange(role)}
											disabled={loading}
											memberTestID={`invite-role-member-${index}`}
											adminTestID={`invite-role-admin-${index}`}
										/>
									)}
								</form.Field>
								{membersField.state.value.length > 1 && (
									<TouchableOpacity
										testID={`invite-remove-button-${index}`}
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
