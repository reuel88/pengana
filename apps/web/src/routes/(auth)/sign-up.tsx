import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { redirectIfAuthenticated } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/(auth)/sign-up")({
	component: SignUpForm,
	beforeLoad: redirectIfAuthenticated,
	validateSearch: z.object({
		invitationId: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Sign Up | pengana" },
			{
				name: "description",
				content: "Create a new pengana account.",
			},
		],
	}),
});
