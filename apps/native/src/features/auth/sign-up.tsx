import { useTranslation } from "@pengana/i18n";
import { makeNativeSignUpSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { Alert } from "react-native";
import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";

import {
	AuthFormCard,
	AuthFormField,
	AuthSubmitButton,
} from "@/shared/ui/auth-form";

function SignUp() {
	const { i18n } = useTranslation();

	return <SignUpForm key={i18n.language} />;
}

function SignUpForm() {
	const { t } = useTranslation();
	const showCheckEmail = () => {
		Alert.alert(t("auth:signUp.checkEmail"));
	};

	const form = useZodForm({
		schema: makeNativeSignUpSchema(t),
		defaultValues: { name: "", email: "", password: "" },
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					name: value.name.trim(),
					email: value.email.trim(),
					password: value.password,
				},
				{
					// Anti-enumeration: always show "check email" regardless of outcome
					onError() {
						showCheckEmail();
					},
					onSuccess() {
						form.reset();
						queryClient.refetchQueries();
						showCheckEmail();
					},
				},
			);
		},
	});

	return (
		<form.Subscribe
			selector={(state) => ({
				isSubmitting: state.isSubmitting,
			})}
		>
			{({ isSubmitting }) => (
				<AuthFormCard title={t("auth:signUp.title")} testID="auth-form">
					<form.Field name="name">
						{(field) => (
							<AuthFormField
								testID="auth-name-input"
								label={t("auth:fields.name")}
								placeholder={t("auth:fields.name")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={field.handleChange}
								errors={field.state.meta.errors}
							/>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<AuthFormField
								testID="auth-email-input"
								label={t("auth:fields.email")}
								placeholder={t("auth:fields.email")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={field.handleChange}
								errors={field.state.meta.errors}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<AuthFormField
								testID="auth-password-input"
								label={t("auth:fields.password")}
								placeholder={t("auth:fields.password")}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={field.handleChange}
								errors={field.state.meta.errors}
								secureTextEntry
								onSubmitEditing={form.handleSubmit}
							/>
						)}
					</form.Field>
					<AuthSubmitButton
						onPress={form.handleSubmit}
						isSubmitting={isSubmitting}
						label={t("auth:signUp.submit")}
						testID="auth-submit"
					/>
				</AuthFormCard>
			)}
		</form.Subscribe>
	);
}

export { SignUp };
