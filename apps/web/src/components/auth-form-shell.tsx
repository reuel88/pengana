import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader } from "./loader";

interface AuthFormShellProps {
	title: string;
	submitLabel: string;
	switchLabel: string;
	switchTo: string;
	onSubmit: () => void;
	form: {
		Subscribe: React.ComponentType<{
			// biome-ignore lint/suspicious/noExplicitAny: FormState generic varies per form
			selector: (state: any) => { canSubmit: boolean; isSubmitting: boolean };
			children: (state: {
				canSubmit: boolean;
				isSubmitting: boolean;
			}) => ReactNode;
		}>;
	};
	children: ReactNode;
}

export function AuthFormShell({
	title,
	submitLabel,
	switchLabel,
	switchTo,
	onSubmit,
	form,
	children,
}: AuthFormShellProps) {
	const { isPending } = authClient.useSession();
	const { t } = useTranslation();

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

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{(state) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? t("submitting") : submitLabel}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Link
					to={switchTo}
					className="text-primary text-sm hover:text-primary/80"
				>
					{switchLabel}
				</Link>
			</div>
		</div>
	);
}
