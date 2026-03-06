import { useTranslation } from "@pengana/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

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

	return (
		<div className="container mx-auto px-4 py-8">
			<h1>{t("paymentSuccessful")}</h1>
			<p>{t("checkoutId", { id: checkout_id })}</p>
		</div>
	);
}
