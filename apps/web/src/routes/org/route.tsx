import { useTranslation } from "@pengana/i18n";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { requireAuthAndOrg } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/org")({
	component: OrgLayout,
	beforeLoad: async () => {
		const { session } = await requireAuthAndOrg();
		return { session };
	},
});

function OrgLayout() {
	const { t } = useTranslation("organization");

	const navLinks = [
		{ to: "/org/members", label: t("nav.members") },
		{ to: "/org/invitations", label: t("nav.invitations") },
		{ to: "/org/teams", label: t("nav.teams") },
		{ to: "/org/roles", label: t("nav.roles") },
		{ to: "/org/settings", label: t("nav.settings") },
	] as const;

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-2">
				<h1 className="font-medium text-lg">{t("title")}</h1>
			</div>
			<nav className="flex gap-4 border-b pb-2 text-sm">
				{navLinks.map(({ to, label }) => (
					<Link
						key={to}
						to={to}
						className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:underline"
						activeOptions={{ exact: true }}
					>
						{label}
					</Link>
				))}
			</nav>
			<Outlet />
		</div>
	);
}
