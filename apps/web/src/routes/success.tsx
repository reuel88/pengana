import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { client } from "@/shared/api/orpc";

const searchSchema = z.object({
	checkout_id: z.string(),
});

export const Route = createFileRoute("/success")({
	component: SuccessPage,
	validateSearch: searchSchema,
});

function SuccessPage() {
	const { checkout_id } = Route.useSearch();
	const { t } = useTranslation("dashboard");

	const confirm = useMutation({
		mutationFn: () =>
			client.billing.confirmCheckout({ checkoutId: checkout_id }),
		retry: 3,
		retryDelay: 2000,
	});

	useEffect(() => {
		confirm.mutate();
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<h1>{t("paymentSuccessful")}</h1>
			{confirm.isPending && <p>{t("common:status.loading")}</p>}
			{confirm.isSuccess && (
				<>
					<p>{t("checkoutId", { id: checkout_id })}</p>
					<Link to="/">
						<Button>{t("backToDashboard")}</Button>
					</Link>
				</>
			)}
			{confirm.isError && (
				<>
					<p>{t("errors:paymentError")}</p>
					<Button onClick={() => confirm.mutate()}>{t("common:retry")}</Button>
				</>
			)}
		</div>
	);
}
