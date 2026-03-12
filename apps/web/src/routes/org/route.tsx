import { useTranslation } from "@pengana/i18n";
import { createFileRoute } from "@tanstack/react-router";

import { requireAuthAndOrg } from "@/shared/lib/auth-client";
import { SectionLayout } from "@/shared/ui/section-layout";

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

	return <SectionLayout title={t("title")} navLinks={navLinks} />;
}
