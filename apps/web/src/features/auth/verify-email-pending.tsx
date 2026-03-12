import { authClient } from "@/shared/lib/auth-client";
import { PendingEmailPage } from "./pending-email-page";

export function VerifyEmailPending() {
	return (
		<PendingEmailPage
			titleKey="auth:verifyEmail.title"
			descriptionKey="auth:verifyEmail.description"
			resendButtonKey="auth:verifyEmail.resend"
			onResend={(email) => authClient.sendVerificationEmail({ email })}
		/>
	);
}
