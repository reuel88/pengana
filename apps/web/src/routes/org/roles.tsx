import { useTranslation } from "@pengana/i18n";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/org/roles")({
	component: RolesPage,
});

function RolesPage() {
	const { t } = useTranslation("organization");

	const roles = [
		{
			key: "owner" as const,
			label: t("roles.owner"),
			description: t("roles.ownerDescription"),
		},
		{
			key: "admin" as const,
			label: t("roles.admin"),
			description: t("roles.adminDescription"),
		},
		{
			key: "member" as const,
			label: t("roles.member"),
			description: t("roles.memberDescription"),
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground text-xs">{t("roles.description")}</p>
			<table className="w-full text-xs">
				<thead>
					<tr className="border-b text-left text-muted-foreground">
						<th className="pb-2">{t("roles.title")}</th>
						<th className="pb-2">{t("roles.permissions")}</th>
					</tr>
				</thead>
				<tbody>
					{roles.map((role) => (
						<tr key={role.key} className="border-b">
							<td className="py-2 font-medium">{role.label}</td>
							<td className="py-2">{role.description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
