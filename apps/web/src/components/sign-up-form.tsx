import { useTranslation } from "@pengana/i18n";
import { makeSignUpSchema } from "@pengana/i18n/zod";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { AuthFormField } from "./auth-form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/onboarding",
						});
						toast.success(t("auth:signUp.success"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: makeSignUpSchema(t),
		},
	});

	return (
		<AuthFormShell
			title={t("auth:signUp.title")}
			submitLabel={t("auth:signUp.submit")}
			switchLabel={t("auth:signUp.switchToSignIn")}
			onSwitch={onSwitchToSignIn}
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
			<form.Field name="name">
				{(field) => (
					<AuthFormField field={field} label={t("auth:fields.name")} />
				)}
			</form.Field>

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
