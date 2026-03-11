import { useTranslation } from "@pengana/i18n";
import { useMemberActions } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { Select } from "@pengana/ui/components/select";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useOrgRole } from "@/shared/hooks/use-org-queries";
import type { Column } from "@/shared/ui/data-table";
import { DataTable } from "@/shared/ui/data-table";
import { useOrgGuard } from "@/widgets/org-guard";

export const Route = createFileRoute("/org/members")({
	component: MembersPage,
});

type Member = {
	id: string;
	userId: string;
	role: string;
	user: { name: string; email: string };
};

function MembersPage() {
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { session } = Route.useRouteContext();
	const { isAdmin } = useOrgRole();

	const { handleUpdateRole, handleRemove, handleLeave } = useMemberActions({
		onUpdateRoleSuccess: () => toast.success(t("members.updateRoleSuccess")),
		onRemoveSuccess: () => toast.success(t("members.removeSuccess")),
		onLeaveSuccess: async () => {
			toast.success(t("members.leaveSuccess"));
			navigate({ to: "/" });
		},
		onError: (message) => toast.error(message || t("members.error")),
		errorMessages: {
			updateRole: t("members.updateRoleError"),
			remove: t("members.removeError"),
			leave: t("members.leaveError"),
		},
	});

	const currentUserId = session.data.user.id;

	const onRemove = async (memberIdOrEmail: string) => {
		if (!confirm(t("members.removeConfirm"))) return;
		await handleRemove(memberIdOrEmail);
	};

	const onLeave = async (members: Member[]) => {
		if (!currentUserId) return;
		const currentMember = members.find((m) => m.userId === currentUserId);
		if (!currentMember) return;
		if (!confirm(t("members.leaveConfirm"))) return;
		await handleLeave(currentMember.id);
	};

	const columns: Column<Member>[] = [
		{ id: "name", header: t("members.name"), cell: (m) => m.user.name },
		{ id: "email", header: t("members.email"), cell: (m) => m.user.email },
		{
			id: "role",
			header: t("members.role"),
			cell: (m) =>
				m.role === "owner" ? (
					<span className="text-xs">{t("roles.owner")}</span>
				) : isAdmin ? (
					<Select
						value={m.role}
						onChange={(e) =>
							handleUpdateRole(m.id, e.target.value as "member" | "admin")
						}
					>
						<option value="admin">{t("roles.admin")}</option>
						<option value="member">{t("roles.member")}</option>
					</Select>
				) : (
					<span className="text-xs">{t(`roles.${m.role}`)}</span>
				),
		},
		{
			id: "actions",
			header: "",
			cellClassName: "py-2 text-right",
			cell: (m) =>
				isAdmin &&
				currentUserId &&
				m.userId !== currentUserId &&
				m.role !== "owner" ? (
					<Button
						variant="destructive"
						size="xs"
						onClick={() => onRemove(m.id)}
					>
						{t("members.remove")}
					</Button>
				) : null,
		},
	];

	const { activeOrg, guardElement } = useOrgGuard();
	if (guardElement) return guardElement;

	const members = (activeOrg?.members || []) as Member[];

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-medium text-sm">{t("members.title")}</h2>
				<Button variant="outline" size="sm" onClick={() => onLeave(members)}>
					{t("members.leave")}
				</Button>
			</div>

			{members.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("members.noMembers")}
				</p>
			) : (
				<DataTable columns={columns} data={members} keyFn={(m) => m.id} />
			)}
		</div>
	);
}
