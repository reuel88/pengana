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
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";

export function AccountSettingsForm() {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();

	return (
		<div className="space-y-6">
			<ChangeNameSection currentName={session?.user.name ?? ""} t={t} />
			<ChangeEmailSection currentEmail={session?.user.email ?? ""} t={t} />
			<ChangePasswordSection t={t} />
		</div>
	);
}

function ChangeNameSection({
	currentName,
	t,
}: {
	currentName: string;
	t: ReturnType<typeof useTranslation>["t"];
}) {
	const [name, setName] = useState(currentName);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await authClient.updateUser({ name });
			toast.success(t("auth:settings.account.updateSuccess"));
		} catch {
			toast.error(t("error.generic"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("auth:settings.account.changeName")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>{t("auth:fields.name")}</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? t("submitting")
							: t("auth:settings.account.changeName")}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function ChangeEmailSection({
	currentEmail,
	t,
}: {
	currentEmail: string;
	t: ReturnType<typeof useTranslation>["t"];
}) {
	const [email, setEmail] = useState(currentEmail);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await authClient.changeEmail({ newEmail: email });
			toast.success(t("auth:settings.account.updateSuccess"));
		} catch {
			toast.error(t("error.generic"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("auth:settings.account.changeEmail")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>{t("auth:fields.email")}</Label>
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<p className="text-muted-foreground text-xs">
						{t("auth:settings.account.changeEmailNote")}
					</p>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? t("submitting")
							: t("auth:settings.account.changeEmail")}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function ChangePasswordSection({
	t,
}: {
	t: ReturnType<typeof useTranslation>["t"];
}) {
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
