import { createFileRoute } from "@tanstack/react-router";
import { DeleteAccountForm } from "@/features/auth/delete-account-form";

export const Route = createFileRoute("/settings/delete-account")({
	component: DeleteAccountPage,
	head: () => ({
		meta: [
			{ title: "Delete Account | pengana" },
			{
				name: "description",
				content: "Delete your pengana account.",
			},
		],
	}),
});

function DeleteAccountPage() {
	return <DeleteAccountForm />;
}
