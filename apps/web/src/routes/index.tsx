import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { orpc } from "@/shared/api/orpc";
import { authClient, requireAuthAndOrg } from "@/shared/lib/auth-client";

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

	const handlePaymentAction = async (action: () => Promise<unknown>) => {
		try {
			await action();
		} catch {
			toast.error(t("errors:paymentError"));
		}
	};

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
			<p>{hasProSubscription ? t("planPro") : t("planFree")}</p>
			{hasProSubscription ? (
				<Button
					onClick={() =>
						handlePaymentAction(() => authClient.customer.portal())
					}
				>
					{t("manageSubscription")}
				</Button>
			) : (
				<Button
					onClick={() =>
						handlePaymentAction(() => authClient.checkout({ slug: "pro" }))
					}
				>
					{t("upgradeToPro")}
				</Button>
			)}
		</div>
	);
}
