import { useTranslation } from "@pengana/i18n";
import { makeResetPasswordSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";
import { AuthFormShell } from "./auth-form-shell";

export function ResetPasswordForm() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { token, error: tokenError } = useSearch({ strict: false });
	const [error, setError] = useState<string | null>(null);

	const form = useZodForm({
		schema: makeResetPasswordSchema(t),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			await authClient.resetPassword(
				{
					newPassword: value.password,
					token: token as string,
				},
				{
					onSuccess: () => {
						toast.success(t("auth:resetPassword.success"));
						navigate({ to: "/login" });
					},
					onError: (err) => {
						setError(err.error.message || err.error.statusText);
					},
				},
			);
		},
	});

	if (tokenError === "INVALID_TOKEN" || (!token && !tokenError)) {
		return (
			<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
				<h1 className="mb-4 font-bold text-3xl">
					{t("auth:resetPassword.title")}
				</h1>
				<p className="mb-4 text-muted-foreground">
					{t("auth:resetPassword.invalidToken")}
				</p>
				<Link
					to="/forgot-password"
					className="text-primary text-sm hover:text-primary/80"
				>
					{t("auth:forgotPassword.switchToSignIn")}
				</Link>
			</div>
		);
	}

	return (
		<AuthFormShell
			title={t("auth:resetPassword.title")}
			submitLabel={t("auth:resetPassword.submit")}
			switchLabel={t("auth:resetPassword.switchToSignIn")}
			switchTo="/login"
			onSubmit={() => form.handleSubmit()}
			form={form}
			errorMessage={error}
		>
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

			<form.Field name="confirmPassword">
				{(field) => (
					<FormField
						field={field}
						label={t("auth:fields.confirmPassword")}
						type="password"
						testId="auth-confirm-password-input"
					/>
				)}
			</form.Field>
		</AuthFormShell>
	);
}
