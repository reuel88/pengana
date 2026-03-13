import { useTranslation } from "@pengana/i18n";
import { makeChangePasswordSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { toast } from "sonner";
import { useInvalidateOrg } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";
import { AccountFieldCard } from "./account-field-card";

export function AccountSettingsForm() {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();
	const { invalidateAll } = useInvalidateOrg();

	return (
		<div className="space-y-6">
			<AccountFieldCard
				title={t("auth:settings.account.changeName")}
				label={t("auth:fields.name")}
				value={session?.user.name ?? ""}
				onSubmit={async (name) => {
					const result = await authClient.updateUser({ name });
					await invalidateAll();
					return result;
				}}
			/>
			<AccountFieldCard
				title={t("auth:settings.account.changeEmail")}
				label={t("auth:fields.email")}
				type="email"
				note={t("auth:settings.account.changeEmailNote")}
				value={session?.user.email ?? ""}
				onSubmit={async (newEmail) => {
					const result = await authClient.changeEmail({ newEmail });
					await invalidateAll();
					return result;
				}}
			/>
			<ChangePasswordSection />
		</div>
	);
}

function ChangePasswordSection() {
	const { t } = useTranslation();
	const { invalidateAll } = useInvalidateOrg();

	const form = useZodForm({
		schema: makeChangePasswordSchema(t),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.changePassword(
				{
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
				},
				{
					onSuccess: () => {
						toast.success(t("auth:settings.account.passwordChanged"));
						void invalidateAll();
						form.reset();
					},
					onError: (err) => {
						toast.error(err.error.message || t("error.generic"));
					},
				},
			);
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("auth:settings.account.changePassword")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="currentPassword">
						{(field) => (
							<FormField
								field={field}
								label={t("auth:settings.account.currentPassword")}
								type="password"
							/>
						)}
					</form.Field>

					<form.Field name="newPassword">
						{(field) => (
							<FormField
								field={field}
								label={t("auth:settings.account.newPassword")}
								type="password"
							/>
						)}
					</form.Field>

					<form.Field name="confirmPassword">
						{(field) => (
							<FormField
								field={field}
								label={t("auth:fields.confirmPassword")}
								type="password"
							/>
						)}
					</form.Field>

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{(state) => (
							<Button
								type="submit"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{state.isSubmitting
									? t("submitting")
									: t("auth:settings.account.changePassword")}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
}
