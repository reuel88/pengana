import { createFileRoute } from "@tanstack/react-router";
import { AccountSettingsForm } from "@/features/auth/account-settings-form";

export const Route = createFileRoute("/settings/account")({
	component: AccountSettingsForm,
	head: () => ({
		meta: [
			{ title: "Account Settings | pengana" },
			{
				name: "description",
				content: "Manage your pengana account settings.",
			},
		],
	}),
});
