import { useTranslation } from "@pengana/i18n";
import { Link } from "@tanstack/react-router";
import { UserMenu } from "@/features/auth/user-menu";
import { LanguageSwitcher } from "@/features/i18n/language-switcher";
import { NotificationCenter } from "@/features/notifications/notification-center";
import { OrgSwitcher } from "@/features/org-management/org-switcher";
import { ModeToggle } from "@/features/theme/mode-toggle";

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
			<hr role="presentation" />
		</header>
	);
}
