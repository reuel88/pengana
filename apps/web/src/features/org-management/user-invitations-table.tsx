import { useTranslation } from "@pengana/i18n";
import type { UserInvitation } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { useInvitationActions } from "@/shared/hooks/use-invitation-actions";
import type { Column } from "@/shared/ui/data-table";
import { DataTable } from "@/shared/ui/data-table";

export function UserInvitationsTable({
	invitations,
}: {
	invitations: UserInvitation[];
}) {
	const { t } = useTranslation("organization");

	const { actingId, handleAccept, handleReject } = useInvitationActions({
		successMessage: t("invitations.acceptSuccess"),
		errorMessage: t("invitations.error"),
		rejectSuccessMessage: t("invitations.rejectSuccess"),
	});

	const columns: Column<UserInvitation>[] = [
		{
			id: "org",
			header: t("create.name"),
			cell: (inv) => inv.organizationName,
		},
		{ id: "role", header: t("invitations.role"), cell: (inv) => inv.role },
		{
			id: "actions",
			header: "",
			cellClassName: "py-2 text-right",
			cell: (inv) => (
				<div className="flex justify-end gap-2">
					<Button
						size="xs"
						onClick={() => handleAccept(inv.id, inv.organizationId)}
						disabled={actingId !== null}
					>
						{t("invitations.accept")}
					</Button>
					<Button
						variant="outline"
						size="xs"
						onClick={() => handleReject(inv.id)}
						disabled={actingId !== null}
					>
						{t("invitations.reject")}
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-medium text-sm">{t("invitations.myInvitations")}</h2>
			{invitations.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("invitations.noInvitations")}
				</p>
			) : (
				<DataTable
					columns={columns}
					data={invitations}
					keyFn={(inv) => inv.id}
				/>
			)}
		</div>
	);
}
