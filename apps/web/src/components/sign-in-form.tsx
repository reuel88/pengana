import { useTranslation } from "@pengana/i18n";
import { makeSignInSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

import { AuthFormField } from "./auth-form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignInForm() {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const form = useZodForm({
		schema: makeSignInSchema(t),
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/",
						});
						toast.success(t("auth:signIn.success"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
	});

	return (
		<AuthFormShell
			title={t("auth:signIn.title")}
			submitLabel={t("auth:signIn.submit")}
			switchLabel={t("auth:signIn.switchToSignUp")}
			switchTo="/sign-up"
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
			<form.Field name="email">
				{(field) => (
					<AuthFormField
						field={field}
						label={t("auth:fields.email")}
						type="email"
					/>
				)}
			</form.Field>

			<form.Field name="password">
				{(field) => (
					<AuthFormField
						field={field}
						label={t("auth:fields.password")}
						type="password"
					/>
				)}
			</form.Field>
		</AuthFormShell>
	);
}
