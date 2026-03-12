import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";

export function SubscriptionCard({ orgId }: { orgId: string }) {
	const { t } = useTranslation("dashboard");

	const subscription = useQuery(
		orpc.billing.getOrgSubscription.queryOptions({
			input: { organizationId: orgId },
			enabled: !!orgId,
		}),
	);

	const hasProSubscription = subscription.data?.data?.status === "active";

	const handlePaymentAction = async (action: () => Promise<unknown>) => {
		try {
			await action();
		} catch (err) {
			console.error("[payment]", err);
			toast.error(t("errors:paymentError"));
		}
	};

	return (
		<>
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
						handlePaymentAction(() =>
							authClient.checkout({
								slug: "pro",
								metadata: { orgId },
							}),
						)
					}
				>
					{t("upgradeToPro")}
				</Button>
			)}
		</>
	);
}
