import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { makeMagicLinkSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";
import { AuthFormShell } from "./auth-form-shell";

export function MagicLinkForm() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const form = useZodForm({
		schema: makeMagicLinkSchema(t),
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.magicLink(
				{
					email: value.email,
					callbackURL: `${env.VITE_WEB_URL}/magic-link/verify`,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/magic-link/pending",
							search: { email: value.email },
						});
					},
					onError: () => {
						// Same redirect to prevent email enumeration
						navigate({
							to: "/magic-link/pending",
							search: { email: value.email },
						});
					},
				},
			);
		},
	});

	return (
		<AuthFormShell
			title={t("auth:magicLink.title")}
			submitLabel={t("auth:magicLink.submit")}
			switchLabel={t("auth:magicLink.switchToPassword")}
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
