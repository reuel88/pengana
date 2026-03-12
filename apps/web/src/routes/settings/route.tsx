import { useTranslation } from "@pengana/i18n";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/settings")({
	component: SettingsLayout,
	beforeLoad: async () => {
		const { session } = await requireAuth();
		return { session };
	},
});

function SettingsLayout() {
	const { t } = useTranslation();

	const navLinks = [
		{ to: "/settings/account", label: t("auth:settings.nav.account") },
		{ to: "/settings/sessions", label: t("auth:settings.nav.sessions") },
		{
			to: "/settings/delete-account",
			label: t("auth:settings.nav.deleteAccount"),
		},
	] as const;

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-2">
				<h1 className="font-medium text-lg">
					{t("auth:settings.account.title")}
				</h1>
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
