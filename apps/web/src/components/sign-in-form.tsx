import { useTranslation } from "@pengana/i18n";
import { makeSignInSchema } from "@pengana/i18n/zod";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { AuthFormField } from "./auth-form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const form = useForm({
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
							to: "/dashboard",
						});
						toast.success(t("auth:signIn.success"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: makeSignInSchema(t),
		},
	});

	return (
		<AuthFormShell
			title={t("auth:signIn.title")}
			submitLabel={t("auth:signIn.submit")}
			switchLabel={t("auth:signIn.switchToSignUp")}
			onSwitch={onSwitchToSignUp}
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
			<div>
				<form.Field name="email">
					{(field) => (
						<AuthFormField
							field={field}
							label={t("auth:fields.email")}
							type="email"
						/>
					)}
				</form.Field>
			</div>

			<div>
				<form.Field name="password">
					{(field) => (
						<AuthFormField
							field={field}
							label={t("auth:fields.password")}
							type="password"
						/>
					)}
				</form.Field>
			</div>
		</AuthFormShell>
	);
}
