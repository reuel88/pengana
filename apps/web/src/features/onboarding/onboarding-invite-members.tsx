import { useTranslation } from "@pengana/i18n";
import { useBatchInvite, useZodForm } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { Input } from "@pengana/ui/components/input";
import { Select } from "@pengana/ui/components/select";
import { toast } from "sonner";
import { z } from "zod";
import { useActiveOrg } from "@/shared/hooks/use-org-queries";
import { FormRoot } from "@/shared/ui/form-root";

const inviteMembersSchema = z.object({
	members: z.array(
		z.object({
			email: z.union([z.string().trim().email(), z.literal("")]),
			role: z.enum(["member", "admin"]),
		}),
	),
});

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { data: activeOrg } = useActiveOrg();

	const { batchInvite } = useBatchInvite({
		organizationId: activeOrg?.id,
		onSuccess: () => {
			toast.success(t("invite.success"));
			onInvited();
		},
		onError: () => toast.error(t("invite.error")),
	});

	const form = useZodForm({
		schema: inviteMembersSchema,
		defaultValues: {
			members: [{ email: "", role: "member" as "member" | "admin" }],
		},
		onSubmit: async ({ value }) => {
			const valid = value.members.filter((m) => m.email.trim());
			const result = await batchInvite(valid);
			if (!result || result.failures.length === 0) {
				return;
			}
			if (result.successes.length === 0) {
				return;
			}

			toast.error(
				`${t("invite.error")}: ${result.failures.map((failure) => failure.email).join(", ")}`,
			);
		},
	});

	return (
		<Card className="w-full max-w-md" data-testid="onboarding-invite-members">
			<CardHeader>
				<CardTitle>{t("invite.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("invite.description")}
				</p>
			</CardHeader>
			<CardContent>
				<FormRoot form={form} className="flex flex-col gap-3">
					<form.Field name="members" mode="array">
						{(membersField) => (
							<>
								{membersField.state.value.map((_entry, index) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: array index is stable for invite rows
										key={index}
										className="flex items-center gap-2"
									>
										<form.Field name={`members[${index}].email`}>
											{(emailField) => (
												<Input
													aria-label={t("organization:invitations.email")}
													type="email"
													value={emailField.state.value as string}
													onBlur={emailField.handleBlur}
													onChange={(e) =>
														emailField.handleChange(e.target.value)
													}
													placeholder={t("invite.emailPlaceholder")}
													className="flex-1"
													data-testid="invite-email-input"
												/>
											)}
										</form.Field>
										<form.Field name={`members[${index}].role`}>
											{(roleField) => (
												<Select
													aria-label={t("organization:invitations.role")}
													value={roleField.state.value as string}
													onChange={(e) =>
														roleField.handleChange(
															e.target.value as "member" | "admin",
														)
													}
													data-testid="invite-role-input"
												>
													<option value="member">
														{t("organization:roles.member")}
													</option>
													<option value="admin">
														{t("organization:roles.admin")}
													</option>
												</Select>
											)}
										</form.Field>
										{membersField.state.value.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => form.removeFieldValue("members", index)}
											>
												{t("invite.remove")}
											</Button>
										)}
									</div>
								))}
							</>
						)}
					</form.Field>
					<Button
						type="button"
						variant="outline"
						data-testid="invite-add-row"
						onClick={() =>
							form.pushFieldValue("members", {
								email: "",
								role: "member" as const,
							})
						}
					>
						{t("invite.addAnother")}
					</Button>
					<form.Subscribe
						selector={(s): [boolean, boolean] => [
							s.isSubmitting,
							!s.values.members.some((m) => m.email.trim()),
						]}
					>
						{([isSubmitting, noValid]) => (
							<Button
								type="submit"
								disabled={isSubmitting || noValid}
								data-testid="invite-submit"
							>
								{isSubmitting ? t("common:submitting") : t("invite.send")}
							</Button>
						)}
					</form.Subscribe>
					<Button
						type="button"
						variant="ghost"
						onClick={onSkip}
						data-testid="invite-skip"
					>
						{t("invite.skip")}
					</Button>
				</FormRoot>
			</CardContent>
		</Card>
	);
}
