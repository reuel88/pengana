import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Route } from "@/routes/(account)/success";
import { client } from "@/shared/api/orpc";

export function SuccessView() {
	const { checkout_id } = Route.useSearch();
	const { t } = useTranslation("dashboard");

	const confirmCheckout = useMutation({
		mutationFn: () =>
			client.billing.confirmCheckout({ checkoutId: checkout_id }),
		retry: 3,
		retryDelay: 2000,
	});

	const didConfirm = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: ref guard prevents double-execution, empty deps is intentional for mount-only effect
	useEffect(() => {
		if (didConfirm.current) return;
		didConfirm.current = true;
		confirmCheckout.mutate();
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<h1>{t("paymentSuccessful")}</h1>
			{confirmCheckout.isPending && <p>{t("common:status.loading")}</p>}
			{confirmCheckout.isSuccess && (
				<>
					<p>{t("checkoutId", { id: checkout_id })}</p>
					<Link to="/">
						<Button>{t("backToDashboard")}</Button>
					</Link>
				</>
			)}
			{confirmCheckout.isError && (
				<>
					<p>{t("errors:paymentError")}</p>
					<Button onClick={() => confirmCheckout.mutate()}>
						{t("common:retry")}
					</Button>
				</>
			)}
		</div>
	);
}
