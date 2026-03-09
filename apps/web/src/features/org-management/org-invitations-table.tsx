import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";

import type { Column } from "@/components/data-table";
import { DataTable } from "@/components/data-table";

interface Invitation {
	id: string;
	email: string;
	role: string;
	status: string;
}

export function OrgInvitationsTable({
	invitations,
	isAdmin,
	onCancel,
	cancellingId,
}: {
	invitations: Invitation[];
	isAdmin: boolean;
	onCancel: (invitationId: string) => void;
	cancellingId: string | null;
}) {
	const { t } = useTranslation("organization");

	const columns: Column<Invitation>[] = [
		{ header: t("invitations.email"), cell: (inv) => inv.email },
		{ header: t("invitations.role"), cell: (inv) => inv.role },
		{
			header: t("invitations.statusHeader"),
			cell: (inv) => t(`invitations.status.${inv.status}`),
		},
		{
			header: "",
			cellClassName: "py-2 text-right",
			cell: (inv) =>
				isAdmin && inv.status === "pending" ? (
					<Button
						variant="outline"
						size="xs"
						onClick={() => onCancel(inv.id)}
						disabled={cancellingId === inv.id}
					>
						{t("invitations.cancel")}
					</Button>
				) : null,
		},
	];

	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-medium text-sm">{t("invitations.pending")}</h2>
			{invitations.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("invitations.noPending")}
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
