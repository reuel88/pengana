import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

import { Loader } from "./loader";
import { Button } from "./ui/button";

interface FormSubscribeProps {
	children: (state: { canSubmit: boolean; isSubmitting: boolean }) => ReactNode;
}

interface AuthFormShellProps {
	title: string;
	submitLabel: string;
	switchLabel: string;
	onSwitch: () => void;
	onSubmit: () => void;
	form: { Subscribe: React.ComponentType<FormSubscribeProps> };
	children: ReactNode;
}

export function AuthFormShell({
	title,
	submitLabel,
	switchLabel,
	onSwitch,
	onSubmit,
	form,
	children,
}: AuthFormShellProps) {
	const { isPending } = authClient.useSession();

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">{title}</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onSubmit();
				}}
				className="space-y-4"
			>
				{children}

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? "Submitting..." : submitLabel}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitch}
					className="text-primary hover:text-primary/80"
				>
					{switchLabel}
				</Button>
			</div>
		</div>
	);
}
