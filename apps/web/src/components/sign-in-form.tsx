import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { AuthFormField } from "./auth-form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<AuthFormShell
			title="Welcome Back"
			submitLabel="Sign In"
			switchLabel="Need an account? Sign Up"
			onSwitch={onSwitchToSignUp}
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
			<div>
				<form.Field name="email">
					{(field) => (
						<AuthFormField field={field} label="Email" type="email" />
					)}
				</form.Field>
			</div>

			<div>
				<form.Field name="password">
					{(field) => (
						<AuthFormField field={field} label="Password" type="password" />
					)}
				</form.Field>
			</div>
		</AuthFormShell>
	);
}
