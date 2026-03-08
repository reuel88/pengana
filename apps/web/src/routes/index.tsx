import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient, requireAuthAndOrg } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
	component: DashboardPage,
	beforeLoad: async () => {
		const { session } = await requireAuthAndOrg();
		const { data: customerState } = await authClient.customer.state();
		return { session, customerState };
	},
});

function DashboardPage() {
	const { session, customerState } = Route.useRouteContext();
	const { t } = useTranslation("dashboard");

	const privateData = useQuery(orpc.privateData.queryOptions());

	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;
	return (
		<div>
			<h1>{t("title")}</h1>
			<p>{t("welcome", { name: session.data.user.name })}</p>
			{privateData.isLoading ? (
				<p>{t("common:status.loading")}</p>
			) : privateData.isError ? (
				<p>{t("common:status.disconnected")}</p>
			) : (
				<p>API: {privateData.data?.data?.message}</p>
			)}
			<p>{hasProSubscription ? t("planPro") : t("planFree")}</p>
			{hasProSubscription ? (
				<Button
					onClick={() => {
						authClient.customer
							.portal()
							.catch(() => toast.error(t("errors:paymentError")));
					}}
				>
					{t("manageSubscription")}
				</Button>
			) : (
				<Button
					onClick={() => {
						authClient
							.checkout({ slug: "pro" })
							.catch(() => toast.error(t("errors:paymentError")));
					}}
				>
					{t("upgradeToPro")}
				</Button>
			)}
		</div>
	);
}
