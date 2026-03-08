import { createFileRoute } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignUpForm } from "@/components/sign-up-form";

export const Route = createFileRoute("/sign-up")({
	component: SignUpPage,
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

function SignUpPage() {
	return (
		<>
			<header className="flex w-full justify-end p-2">
				<LanguageSwitcher />
			</header>
			<SignUpForm />
		</>
	);
}
