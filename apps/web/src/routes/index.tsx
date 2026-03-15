import { useTranslation } from "@pengana/i18n";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionCard } from "@/features/billing/subscription-card";
import { orpc } from "@/shared/api/orpc";
import { useActiveOrg } from "@/shared/hooks/use-org-queries";
import { requireAuthAndOrg } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/")({
	component: DashboardPage,
	beforeLoad: async () => {
		const { session } = await requireAuthAndOrg();
		return { session };
	},
});

function DashboardPage() {
	const { session } = Route.useRouteContext();
	const { t } = useTranslation("dashboard");

	const privateData = useQuery(orpc.privateData.queryOptions());

	const activeOrg = useActiveOrg({
		enabled: !!session.data.session.activeOrganizationId,
	});
	const orgId = activeOrg.data?.id ?? "";

	return (
		<div>
			<h1>{t("title")}</h1>
			<p>{t("welcome", { name: session.data.user.name })}</p>
			{/* First .data is React Query's, second .data is the API envelope */}
			{privateData.isLoading ? (
				<p>{t("common:status.loading")}</p>
			) : privateData.isError ? (
				<p>{t("common:status.disconnected")}</p>
			) : (
				<p>API: {privateData.data?.data?.message}</p>
			)}
			<SubscriptionCard orgId={orgId} />
		</div>
	);
}
