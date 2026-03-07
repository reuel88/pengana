import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
	useActiveOrg,
	useInvalidateOrg,
	useUserInvitations,
} from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/org/invitations")({
	component: InvitationsPage,
});

function InvitationsPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin">("member");
	const [loading, setLoading] = useState(false);
	const { isAdmin } = useOrgRole();
	const { data: myInvitations } = useUserInvitations();
	const { invalidateActiveOrg, invalidateListOrgs, invalidateUserInvitations } =
		useInvalidateOrg();

	if (isPending) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const invitations = activeOrg.invitations || [];

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { error } = await authClient.organization.inviteMember({
				email,
				role,
				organizationId: activeOrg.id,
			});
			if (error) {
				toast.error(error.message || t("invitations.error"));
				return;
			}
			toast.success(t("invitations.sendSuccess"));
			setEmail("");
			await invalidateActiveOrg();
		} catch {
			toast.error(t("invitations.error"));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = async (invitationId: string) => {
		try {
			const { error } = await authClient.organization.cancelInvitation({
				invitationId,
			});
			if (error) {
				toast.error(error.message || t("invitations.error"));
				return;
			}
			toast.success(t("invitations.cancelSuccess"));
			await invalidateActiveOrg();
		} catch {
			toast.error(t("invitations.error"));
		}
	};

	const handleAccept = async (invitationId: string) => {
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId,
			});
			if (error) {
				toast.error(error.message || t("invitations.error"));
				return;
			}
			toast.success(t("invitations.acceptSuccess"));
			await Promise.all([
				invalidateUserInvitations(),
				invalidateActiveOrg(),
				invalidateListOrgs(),
			]);
		} catch {
			toast.error(t("invitations.error"));
		}
	};

	const handleReject = async (invitationId: string) => {
		try {
			const { error } = await authClient.organization.rejectInvitation({
				invitationId,
			});
			if (error) {
				toast.error(error.message || t("invitations.error"));
				return;
			}
			toast.success(t("invitations.rejectSuccess"));
			await Promise.all([
				invalidateUserInvitations(),
				invalidateActiveOrg(),
				invalidateListOrgs(),
			]);
		} catch {
			toast.error(t("invitations.error"));
		}
	};

	const pendingUserInvitations = (myInvitations ?? []).filter(
		(i) => i.status === "pending",
	);

	return (
		<div className="flex flex-col gap-6">
			{isAdmin && (
				<div className="flex max-w-md flex-col gap-3">
					<h2 className="font-medium text-sm">{t("invitations.invite")}</h2>
					<form onSubmit={handleInvite} className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<Label>{t("invitations.email")}</Label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={t("invitations.emailPlaceholder")}
								required
							/>
						</div>
						<div className="flex flex-col gap-1">
							<Label>{t("invitations.role")}</Label>
							<select
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
			)}

			<div className="flex flex-col gap-3">
				<h2 className="font-medium text-sm">{t("invitations.pending")}</h2>
				{invitations.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("invitations.noPending")}
					</p>
				) : (
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pb-2">{t("invitations.email")}</th>
								<th className="pb-2">{t("invitations.role")}</th>
								<th className="pb-2">Status</th>
								<th className="pb-2" />
							</tr>
						</thead>
						<tbody>
							{invitations.map((inv) => (
								<tr key={inv.id} className="border-b">
									<td className="py-2">{inv.email}</td>
									<td className="py-2">{inv.role}</td>
									<td className="py-2">
										{t(`invitations.status.${inv.status}`)}
									</td>
									<td className="py-2 text-right">
										{isAdmin && inv.status === "pending" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => handleCancel(inv.id)}
											>
												{t("invitations.cancel")}
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<div className="flex flex-col gap-3">
				<h2 className="font-medium text-sm">
					{t("invitations.myInvitations")}
				</h2>
				{pendingUserInvitations.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("invitations.noInvitations")}
					</p>
				) : (
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pb-2">{t("create.name")}</th>
								<th className="pb-2">{t("invitations.role")}</th>
								<th className="pb-2" />
							</tr>
						</thead>
						<tbody>
							{pendingUserInvitations.map((inv) => (
								<tr key={inv.id} className="border-b">
									<td className="py-2">{inv.organizationId}</td>
									<td className="py-2">{inv.role}</td>
									<td className="py-2 text-right">
										<div className="flex justify-end gap-2">
											<Button size="xs" onClick={() => handleAccept(inv.id)}>
												{t("invitations.accept")}
											</Button>
											<Button
												variant="outline"
												size="xs"
												onClick={() => handleReject(inv.id)}
											>
												{t("invitations.reject")}
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
