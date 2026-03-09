import { useTranslation } from "@pengana/i18n";
import { useInviteMember } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { toast } from "sonner";

export function InviteMemberForm({
	organizationId,
}: {
	organizationId: string;
}) {
	const { t } = useTranslation("organization");

	const { email, setEmail, role, setRole, handleInvite, loading } =
		useInviteMember({
			onSuccess: () => toast.success(t("invitations.sendSuccess")),
			onError: (message) => toast.error(message || t("invitations.error")),
		});

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleInvite(organizationId);
	};

	return (
		<div className="flex max-w-md flex-col gap-3">
			<h2 className="font-medium text-sm">{t("invitations.invite")}</h2>
			<form onSubmit={onSubmit} className="flex flex-col gap-3">
				<div className="flex flex-col gap-1">
					<Label htmlFor="invite-email">{t("invitations.email")}</Label>
					<Input
						id="invite-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t("invitations.emailPlaceholder")}
						required
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="invite-role">{t("invitations.role")}</Label>
					<select
						id="invite-role"
						value={role}
						onChange={(e) => setRole(e.target.value as "member" | "admin")}
						className="h-8 rounded-none border border-input bg-transparent px-2.5 text-xs"
					>
						<option value="admin">{t("roles.admin")}</option>
						<option value="member">{t("roles.member")}</option>
					</select>
				</div>
				<Button type="submit" disabled={loading || !email}>
					{loading ? t("common:submitting") : t("invitations.send")}
				</Button>
			</form>
		</div>
	);
}
