import { authClient } from "@/shared/lib/auth-client";
import { EmailSentNotice } from "./email-sent-notice";

export function VerifyEmailPending() {
	return (
		<EmailSentNotice
			titleKey="auth:verifyEmail.title"
			descriptionKey="auth:verifyEmail.description"
			resendButtonKey="auth:verifyEmail.resend"
			onResend={(email) => authClient.sendVerificationEmail({ email })}
		/>
	);
}
