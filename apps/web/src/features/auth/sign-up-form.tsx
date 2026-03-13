import { useTranslation } from "@pengana/i18n";
import { makeSignUpSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { authClient } from "@/shared/lib/auth-client";
import { persistPendingInvitation } from "@/shared/lib/auth-flow";
import { FormField } from "@/shared/ui/form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignUpForm() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { invitationId } = useSearch({ strict: false });

	const navigateWithCheckEmail = (email?: string) => {
		navigate({ to: "/verify-email", search: { email, invitationId } });
	};

	const form = useZodForm({
		schema: makeSignUpSchema(t),
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			persistPendingInvitation(invitationId);
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigateWithCheckEmail(value.email);
					},
					// Anti-enumeration: identical behavior prevents leaking whether email exists
					onError: () => {
						navigateWithCheckEmail(value.email);
					},
				},
			);
		},
	});

	return (
		<AuthFormShell
			title={t("auth:signUp.title")}
			submitLabel={t("auth:signUp.submit")}
			switchLabel={t("auth:signUp.switchToSignIn")}
			switchTo="/login"
			switchSearch={{ invitationId }}
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
			<form.Field name="name">
				{(field) => (
					<FormField
						field={field}
						label={t("auth:fields.name")}
						testId="auth-name-input"
					/>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<FormField
						field={field}
						label={t("auth:fields.email")}
						type="email"
						testId="auth-email-input"
					/>
				)}
			</form.Field>

			<form.Field name="password">
				{(field) => (
					<FormField
						field={field}
						label={t("auth:fields.password")}
						type="password"
						testId="auth-password-input"
					/>
				)}
			</form.Field>
		</AuthFormShell>
	);
}
