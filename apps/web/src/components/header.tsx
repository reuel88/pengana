import { useTranslation } from "@pengana/i18n";
import { Link } from "@tanstack/react-router";
import { NotificationCenter } from "@/features/notifications/notification-center";
import { LanguageSwitcher } from "./language-switcher";
import { ModeToggle } from "./mode-toggle";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

export function Header() {
	const { t } = useTranslation();

	const links = [
		{ to: "/", label: t("nav.dashboard") },
		{ to: "/todos", label: t("nav.todos") },
	] as const;

	return (
		<header>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex items-center gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
					<OrgSwitcher />
				</nav>
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<ModeToggle />
					<NotificationCenter />
					<UserMenu />
				</div>
			</div>
			<hr />
		</header>
	);
}
