import { Button } from "@pengana/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { authClient, requireAuth } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
	beforeLoad: async () => {
		const { session } = await requireAuth();
		const { data: customerState } = await authClient.customer.state();
		return { session, customerState };
	},
});

function DashboardPage() {
	const { session, customerState } = Route.useRouteContext();

	const privateData = useQuery(orpc.privateData.queryOptions());

	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;
	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session.data.user.name}</p>
			<p>API: {privateData.data?.message}</p>
			<p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
			{hasProSubscription ? (
				<Button
					onClick={() => {
						authClient.customer.portal().catch(console.error);
					}}
				>
					Manage Subscription
				</Button>
			) : (
				<Button
					onClick={() => {
						authClient.checkout({ slug: "pro" }).catch(console.error);
					}}
				>
					Upgrade to Pro
				</Button>
			)}
		</div>
	);
}
