import { useTranslation } from "@pengana/i18n";
import { useMemberActions } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useActiveOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";

export const Route = createFileRoute("/org/members")({
	component: MembersPage,
});

function MembersPage() {
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { session } = Route.useRouteContext();
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isAdmin } = useOrgRole();

	const { handleUpdateRole, handleRemove, handleLeave } = useMemberActions({
		onUpdateRoleSuccess: () => toast.success(t("members.updateRoleSuccess")),
		onRemoveSuccess: () => toast.success(t("members.removeSuccess")),
		onLeaveSuccess: async () => {
			toast.success(t("members.leaveSuccess"));
			navigate({ to: "/" });
		},
		onError: (message) => toast.error(message || t("members.error")),
	});

	if (isPending) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const members = activeOrg.members || [];
	const currentUserId = session.data.user.id;

	const onRemove = async (memberIdOrEmail: string) => {
		if (!confirm(t("members.removeConfirm"))) return;
		await handleRemove(memberIdOrEmail);
	};

	const onLeave = async () => {
		if (!currentUserId) return;
		if (!confirm(t("members.leaveConfirm"))) return;
		await handleLeave(currentUserId);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-medium text-sm">{t("members.title")}</h2>
				<Button variant="outline" size="sm" onClick={onLeave}>
					{t("members.leave")}
				</Button>
			</div>

			{members.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("members.noMembers")}
				</p>
			) : (
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-left text-muted-foreground">
							<th className="pb-2">{t("members.name")}</th>
							<th className="pb-2">{t("members.email")}</th>
							<th className="pb-2">{t("members.role")}</th>
							<th className="pb-2" />
						</tr>
					</thead>
					<tbody>
						{members.map((member) => (
							<tr key={member.id} className="border-b">
								<td className="py-2">{member.user.name}</td>
								<td className="py-2">{member.user.email}</td>
								<td className="py-2">
									{member.role === "owner" ? (
										<span className="text-xs">{t("roles.owner")}</span>
									) : isAdmin ? (
										<select
											value={member.role}
											onChange={(e) =>
												handleUpdateRole(
													member.id,
													e.target.value as "member" | "admin",
												)
											}
											className="bg-transparent text-xs"
										>
											<option value="admin">{t("roles.admin")}</option>
											<option value="member">{t("roles.member")}</option>
										</select>
									) : (
										<span className="text-xs">{t(`roles.${member.role}`)}</span>
									)}
								</td>
								<td className="py-2 text-right">
									{isAdmin &&
										currentUserId &&
										member.userId !== currentUserId &&
										member.role !== "owner" && (
											<Button
												variant="destructive"
												size="xs"
												onClick={() => onRemove(member.id)}
											>
												{t("members.remove")}
											</Button>
										)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
