import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Link, useSearch } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";

export function VerifyEmailPending() {
	const { t } = useTranslation();
	const { email } = useSearch({ strict: false });
	const [isResending, setIsResending] = useState(false);

	const handleResend = async () => {
		if (!email) return;
		setIsResending(true);
		try {
			await authClient.sendVerificationEmail({ email });
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
			<h1 className="mb-2 font-bold text-3xl">{t("auth:verifyEmail.title")}</h1>
			<p className="mb-6 text-muted-foreground">
				{t("auth:verifyEmail.description")}
			</p>

			{email && (
				<Button
					variant="outline"
					className="mb-4 w-full"
					onClick={handleResend}
					disabled={isResending}
				>
					{isResending ? t("submitting") : t("auth:verifyEmail.resend")}
				</Button>
			)}

			<Link to="/login" className="text-primary text-sm hover:text-primary/80">
				{t("auth:verifyEmail.backToSignIn")}
			</Link>
		</div>
	);
}
