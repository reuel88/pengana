import { useTranslation } from "@pengana/i18n";
import { useInviteMember, useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { Select } from "@pengana/ui/components/select";
import { toast } from "sonner";
import { z } from "zod";

import { FormRoot } from "@/components/form-root";

const inviteMemberSchema = z.object({
	email: z.string().email(),
	role: z.enum(["member", "admin"]),
});

export function InviteMemberForm({
	organizationId,
}: {
	organizationId: string;
}) {
	const { t } = useTranslation("organization");

	const { inviteMember } = useInviteMember({
		onSuccess: () => toast.success(t("invitations.sendSuccess")),
		onError: (message) => toast.error(message || t("invitations.error")),
	});

	const form = useZodForm({
		schema: inviteMemberSchema,
		defaultValues: { email: "", role: "member" as "member" | "admin" },
		onSubmit: async ({ value }) => {
			await inviteMember({ ...value, organizationId });
			form.reset();
		},
	});

	return (
		<div className="flex max-w-md flex-col gap-3">
			<h2 className="font-medium text-sm">{t("invitations.invite")}</h2>
			<FormRoot form={form} className="flex flex-col gap-3">
				<form.Field name="email">
					{(field) => (
						<div className="flex flex-col gap-1">
							<Label htmlFor="invite-email">{t("invitations.email")}</Label>
							<Input
								id="invite-email"
								type="email"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={t("invitations.emailPlaceholder")}
								required
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="role">
					{(field) => (
						<div className="flex flex-col gap-1">
							<Label htmlFor="invite-role">{t("invitations.role")}</Label>
							<Select
								id="invite-role"
								value={field.state.value}
								onChange={(e) =>
									field.handleChange(e.target.value as "member" | "admin")
								}
							>
								<option value="admin">{t("roles.admin")}</option>
								<option value="member">{t("roles.member")}</option>
							</Select>
						</div>
					)}
				</form.Field>
				<form.Subscribe
					selector={(s): [boolean, boolean] => [
						s.isSubmitting,
						!s.values.email,
					]}
				>
					{([isSubmitting, emailEmpty]) => (
						<Button type="submit" disabled={isSubmitting || emailEmpty}>
							{isSubmitting ? t("common:submitting") : t("invitations.send")}
						</Button>
					)}
				</form.Subscribe>
			</FormRoot>
		</div>
	);
}
