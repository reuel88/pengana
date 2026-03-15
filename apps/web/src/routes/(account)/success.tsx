import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SuccessView } from "@/features/onboarding/ui/views/success-view";

const searchSchema = z.object({
	checkout_id: z.string(),
});

export const Route = createFileRoute("/(account)/success")({
	component: SuccessView,
	validateSearch: searchSchema,
});
