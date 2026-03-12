import { useTranslation } from "@pengana/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/shared/lib/auth-client";
import { SectionLayout } from "@/shared/ui/section-layout";

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
		<SectionLayout
			title={t("auth:settings.account.title")}
			navLinks={navLinks}
		/>
	);
}
