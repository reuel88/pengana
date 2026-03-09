import { createFileRoute } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignInForm } from "@/components/sign-in-form";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	head: () => ({
		meta: [
			{ title: "Sign In | pengana" },
			{
				name: "description",
				content: "Sign in to your pengana account.",
			},
		],
	}),
});

function LoginPage() {
	return (
		<>
			<header className="flex w-full justify-end p-2">
				<LanguageSwitcher />
			</header>
			<SignInForm />
		</>
	);
}
