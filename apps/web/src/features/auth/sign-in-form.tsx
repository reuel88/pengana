import { useTranslation } from "@pengana/i18n";
import { makeSignInSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useInvalidateOrg } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignInForm() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { invitationId } = useSearch({ strict: false });
	const [error, setError] = useState<string | null>(null);
	const { invalidateAll } = useInvalidateOrg();

	const form = useZodForm({
		schema: makeSignInSchema(t),
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: async () => {
						await invalidateAll();
						toast.success(t("auth:signIn.success"));
						if (invitationId) {
							navigate({
								to: "/invitation/$invitationId",
								params: { invitationId },
							});
							return;
						}
						navigate({ to: "/" });
					},
					onError: () => {
						setError(t("errors:failedToSignIn"));
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
			switchSearch={{ invitationId }}
			onSubmit={() => form.handleSubmit()}
			form={form}
			errorMessage={error}
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

			<div className="flex justify-between">
				<Link
					to="/magic-link"
					className="text-primary text-sm hover:text-primary/80"
				>
					{t("auth:signIn.orMagicLink")}
				</Link>
				<Link
					to="/forgot-password"
					search={{ invitationId }}
					className="text-primary text-sm hover:text-primary/80"
				>
					{t("auth:signIn.forgotPassword")}
				</Link>
			</div>
		</AuthFormShell>
	);
}
