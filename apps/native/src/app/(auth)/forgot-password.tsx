import { useTranslation } from "@pengana/i18n";
import { makeForgotPasswordSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { orpc } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { normalizeRedirectTarget } from "@/shared/lib/auth-flow";
import { useTheme } from "@/shared/lib/theme";
import { authScreenStyles } from "@/shared/styles/auth";
import { AuthFormCard, AuthSubmitButton } from "@/shared/ui/auth-form";
import { Container } from "@/shared/ui/container";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

function getAuthConfigErrorMessage(
	error: unknown,
	fallbackMessage: string,
): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallbackMessage;
}

export default function ForgotPasswordScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const params = useLocalSearchParams<{ invitationId?: string | string[] }>();
	const invitationId = normalizeRedirectTarget(params.invitationId);
	const [notice, setNotice] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const authConfig = useQuery({
		...orpc.authConfig.queryOptions(),
		retry: false,
	});
	const webBaseUrl = authConfig.data?.data.webBaseUrl;
	const authConfigErrorMessage = authConfig.isError
		? getAuthConfigErrorMessage(authConfig.error, t("common:generic"))
		: null;
	const errorMessage = authConfigErrorMessage ?? submitError;

	const form = useZodForm({
		schema: makeForgotPasswordSchema(t),
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			if (!webBaseUrl) {
				setSubmitError(
					getAuthConfigErrorMessage(authConfig.error, t("common:generic")),
				);
				throw new Error("Missing web base URL for password reset.");
			}

			setSubmitError(null);
			setNotice(null);

			// Anti-enumeration: always show the same generic success message regardless
			// of whether the email exists. This prevents attackers from discovering
			// which emails are registered in the system.
			await authClient.requestPasswordReset(
				{
					email: value.email.trim(),
					redirectTo: `${webBaseUrl}/reset-password`,
				},
				{
					onSuccess: () => {
						setSubmitError(null);
						setNotice(t("auth:forgotPassword.success"));
					},
					onError: () => {
						setSubmitError(null);
						setNotice(t("auth:forgotPassword.success"));
					},
				},
			);
		},
	});

	return (
		<Container>
			<ScrollView
				style={authScreenStyles.scrollView}
				contentContainerStyle={authScreenStyles.content}
			>
				<AuthFormCard
					title={t("auth:forgotPassword.title")}
					error={errorMessage}
				>
					<form.Field name="email">
						{(field) => (
							<ThemedTextInput
								testID="auth-email-input"
								label={t("auth:fields.email")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={(text) => {
									field.handleChange(text);
									if (submitError) {
										setSubmitError(null);
									}
								}}
								keyboardType="email-address"
								autoCapitalize="none"
								error={field.state.meta.errors[0]?.message}
							/>
						)}
					</form.Field>
					{notice ? (
						<Text style={[styles.notice, { color: theme.text }]}>{notice}</Text>
					) : null}
					{authConfig.isPending ? (
						<View style={styles.loading}>
							<ActivityIndicator color={theme.primary} />
						</View>
					) : null}
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<AuthSubmitButton
								onPress={form.handleSubmit}
								isSubmitting={isSubmitting}
								disabled={!authConfig.isSuccess || !webBaseUrl}
								label={t("auth:forgotPassword.submit")}
								testID="auth-submit"
							/>
						)}
					</form.Subscribe>
				</AuthFormCard>
				<Link
					href={{ pathname: "/(auth)/login", params: { invitationId } }}
					style={authScreenStyles.link}
				>
					<Text style={[authScreenStyles.linkText, { color: theme.primary }]}>
						{t("auth:forgotPassword.switchToSignIn")}
					</Text>
				</Link>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	notice: {
		fontSize: 13,
		lineHeight: 18,
		marginBottom: 12,
		opacity: 0.8,
	},
	loading: {
		paddingVertical: 12,
		alignItems: "center",
	},
});
