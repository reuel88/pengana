import { useTranslation } from "@pengana/i18n";
import { makeNativeSignUpSchema } from "@pengana/i18n/zod";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/utils/form-helpers";
import { queryClient } from "@/utils/orpc";

import { AuthFormCard, AuthFormField, AuthSubmitButton } from "./auth-form";

function SignUp() {
	const [error, setError] = useState<string | null>(null);
	const { t } = useTranslation();

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: { onSubmit: makeNativeSignUpSchema(t) },
		onSubmit: async ({ value, formApi }) => {
			await authClient.signUp.email(
				{
					name: value.name.trim(),
					email: value.email.trim(),
					password: value.password,
				},
				{
					onError(error) {
						setError(error.error?.message || t("errors:failedToSignUp"));
					},
					onSuccess() {
						setError(null);
						formApi.reset();
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
					title={t("auth:signUp.title")}
					error={error ?? validationError}
				>
					<form.Field name="name">
						{(field) => (
							<AuthFormField
								placeholder={t("auth:fields.name")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={field.handleChange}
								onClearError={() => error && setError(null)}
							/>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<AuthFormField
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
						label={t("auth:signUp.submit")}
					/>
				</AuthFormCard>
			)}
		</form.Subscribe>
	);
}

export { SignUp };
