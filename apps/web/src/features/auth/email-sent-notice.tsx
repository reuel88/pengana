import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Link, useSearch } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function EmailSentNotice({
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
	const { email, invitationId } = useSearch({ strict: false });
	const [isResending, setIsResending] = useState(false);
	const resendEmail =
		typeof email === "string" && email.trim().length > 0 ? email : null;
	const validatedInvitationId =
		typeof invitationId === "string" && invitationId.trim().length > 0
			? invitationId.trim()
			: null;

	const handleResend = async () => {
		if (!resendEmail) return;
		setIsResending(true);
		try {
			await onResend(resendEmail);
		} catch {
			// Silent — anti-enumeration
		} finally {
			toast.success(t("auth:verifyEmail.resendSuccess"));
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

			{resendEmail && (
				<Button
					variant="outline"
					className="mb-4 w-full"
					onClick={handleResend}
					disabled={isResending}
				>
					{isResending ? t("submitting") : t(resendButtonKey)}
				</Button>
			)}

			<Link
				to="/login"
				search={{ invitationId: validatedInvitationId ?? undefined }}
				className="text-primary text-sm hover:text-primary/80"
			>
				{t("auth:verifyEmail.backToSignIn")}
			</Link>
		</div>
	);
}
