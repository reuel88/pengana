import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";

export function SubscriptionCard({ orgId }: { orgId: string }) {
	const { t } = useTranslation("dashboard");
	const [isProcessing, setIsProcessing] = useState(false);

	const subscription = useQuery(
		orpc.billing.getOrgSubscription.queryOptions({
			input: { organizationId: orgId },
			enabled: !!orgId,
		}),
	);

	const hasProSubscription = subscription.data?.data?.status === "active";

	const handlePaymentAction = async (action: () => Promise<unknown>) => {
		if (isProcessing || !orgId) return;
		setIsProcessing(true);
		try {
			await action();
		} catch {
			toast.error(t("errors:paymentError"));
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<>
			<p>{hasProSubscription ? t("planPro") : t("planFree")}</p>
			{hasProSubscription ? (
				<Button
					disabled={isProcessing || !orgId}
					onClick={() =>
						handlePaymentAction(() => authClient.customer.portal())
					}
				>
					{t("manageSubscription")}
				</Button>
			) : (
				<Button
					disabled={isProcessing || !orgId}
					onClick={() =>
						handlePaymentAction(() =>
							authClient.checkout({
								slug: env.VITE_POLAR_PRO_PRODUCT_SLUG,
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
