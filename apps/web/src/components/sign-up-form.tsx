import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { AuthFormField } from "./auth-form-field";
import { AuthFormShell } from "./auth-form-shell";

export function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						toast.success("Sign up successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<AuthFormShell
			title="Create Account"
			submitLabel="Sign Up"
			switchLabel="Already have an account? Sign In"
			onSwitch={onSwitchToSignIn}
			onSubmit={() => form.handleSubmit()}
			form={form}
		>
			<div>
				<form.Field name="name">
					{(field) => <AuthFormField field={field} label="Name" />}
				</form.Field>
			</div>

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
