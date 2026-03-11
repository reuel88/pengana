import { useTranslation } from "@pengana/i18n";
import { makeNativeSignInSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/utils/form-helpers";
import { queryClient } from "@/utils/orpc";

import { AuthFormCard, AuthFormField, AuthSubmitButton } from "./auth-form";

function SignIn() {
	const [error, setError] = useState<string | null>(null);
	const { t } = useTranslation();

	const form = useZodForm({
		schema: makeNativeSignInSchema(t),
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{ email: value.email.trim(), password: value.password },
				{
					onError(error) {
						setError(error.error?.message || t("errors:failedToSignIn"));
					},
					onSuccess() {
						setError(null);
						form.reset();
						queryClient.refetchQueries();
					},
				},
			);
		},
	});

	return (
		<form.Subscribe
			selector={(state) => ({
				isSubmitting: state.isSubmitting,
				validationError: getErrorMessage(state.errorMap.onSubmit),
			})}
		>
			{({ isSubmitting, validationError }) => (
				<AuthFormCard
					title={t("auth:signIn.submit")}
					error={error ?? validationError}
					testID="auth-form"
				>
					<form.Field name="email">
						{(field) => (
							<AuthFormField
								testID="auth-email-input"
								placeholder={t("auth:fields.email")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={field.handleChange}
								onClearError={() => error && setError(null)}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<AuthFormField
								testID="auth-password-input"
								placeholder={t("auth:fields.password")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={field.handleChange}
								onClearError={() => error && setError(null)}
								secureTextEntry
								onSubmitEditing={form.handleSubmit}
							/>
						)}
					</form.Field>
					<AuthSubmitButton
						onPress={form.handleSubmit}
						isSubmitting={isSubmitting}
						label={t("auth:signIn.submit")}
						testID="auth-submit"
					/>
				</AuthFormCard>
			)}
		</form.Subscribe>
	);
}

export { SignIn };
