import { useTranslation } from "@pengana/i18n";
import { makeDeleteAccountSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { FormField } from "@/shared/ui/form-field";

export function DeleteAccountForm() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const form = useZodForm({
		schema: makeDeleteAccountSchema(t),
		defaultValues: {
			confirmation: "",
		},
		onSubmit: async () => {
			await authClient.deleteUser(undefined, {
				onSuccess: () => {
					toast.success(t("auth:settings.deleteAccount.success"));
					queryClient.clear();
					navigate({ to: "/login" });
				},
				onError: (err) => {
					toast.error(err.error.message || t("error.generic"));
				},
			});
		},
	});

	return (
		<div className="mx-auto max-w-md space-y-6">
			<div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
				<CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
				<p className="text-destructive text-sm">
					{t("auth:settings.deleteAccount.warning")}
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="confirmation">
					{(field) => (
						<FormField
							field={field}
							label={t("auth:settings.deleteAccount.confirm")}
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
							variant="destructive"
							className="w-full"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting
								? t("submitting")
								: t("auth:settings.deleteAccount.submit")}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
