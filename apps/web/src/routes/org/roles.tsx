import { useTranslation } from "@pengana/i18n";
import { createFileRoute } from "@tanstack/react-router";

import type { Column } from "@/components/data-table";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/org/roles")({
	component: RolesPage,
});

interface Role {
	key: string;
	label: string;
	description: string;
}

function RolesPage() {
	const { t } = useTranslation("organization");

	const roles: Role[] = [
		{
			key: "owner",
			label: t("roles.owner"),
			description: t("roles.ownerDescription"),
		},
		{
			key: "admin",
			label: t("roles.admin"),
			description: t("roles.adminDescription"),
		},
		{
			key: "member",
			label: t("roles.member"),
			description: t("roles.memberDescription"),
		},
	];

	const columns: Column<Role>[] = [
		{
			id: "title",
			header: t("roles.title"),
			cellClassName: "py-2 font-medium",
			cell: (role) => role.label,
		},
		{
			id: "permissions",
			header: t("roles.permissions"),
			cell: (role) => role.description,
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground text-xs">{t("roles.description")}</p>
			<DataTable columns={columns} data={roles} keyFn={(role) => role.key} />
		</div>
	);
}
