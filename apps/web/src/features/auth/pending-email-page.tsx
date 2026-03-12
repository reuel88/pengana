import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Link, useSearch } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PendingEmailPage({
	titleKey,
	descriptionKey,
	resendButtonKey,
	onResend,
}: {
	titleKey: string;
	descriptionKey: string;
	resendButtonKey: string;
	onResend: (email: string) => Promise<unknown>;
}) {
	const { t } = useTranslation();
	const { email } = useSearch({ strict: false });
	const [isResending, setIsResending] = useState(false);

	const handleResend = async () => {
		if (!email) return;
		setIsResending(true);
		try {
			await onResend(email);
			toast.success(t("auth:verifyEmail.resendSuccess"));
		} catch {
			// Silent — anti-enumeration
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
			<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Mail className="h-8 w-8 text-primary" />
			</div>
			<h1 className="mb-2 font-bold text-3xl">{t(titleKey)}</h1>
			<p className="mb-6 text-muted-foreground">{t(descriptionKey)}</p>

			{email && (
				<Button
					variant="outline"
					className="mb-4 w-full"
					onClick={handleResend}
					disabled={isResending}
				>
					{isResending ? t("submitting") : t(resendButtonKey)}
				</Button>
			)}

			<Link to="/login" className="text-primary text-sm hover:text-primary/80">
				{t("auth:verifyEmail.backToSignIn")}
			</Link>
		</div>
	);
}
