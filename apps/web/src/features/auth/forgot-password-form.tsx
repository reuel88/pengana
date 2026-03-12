import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { makeForgotPasswordSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";
import { AuthFormShell } from "./auth-form-shell";

export function ForgotPasswordForm() {
	const { t } = useTranslation();

	const form = useZodForm({
		schema: makeForgotPasswordSchema(t),
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.requestPasswordReset(
				{
					email: value.email,
					redirectTo: `${env.VITE_WEB_URL}/reset-password`,
				},
				{
					onSuccess: () => {
						toast.success(t("auth:forgotPassword.success"));
					},
					onError: () => {
						// Show same success message to prevent email enumeration
						toast.success(t("auth:forgotPassword.success"));
					},
				},
			);
		},
	});

	return (
		<AuthFormShell
			title={t("auth:forgotPassword.title")}
			submitLabel={t("auth:forgotPassword.submit")}
			switchLabel={t("auth:forgotPassword.switchToSignIn")}
			switchTo="/login"
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
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
		</AuthFormShell>
	);
}
