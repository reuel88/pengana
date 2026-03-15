import { env } from "@pengana/env/web";
import { authClient } from "@/shared/lib/auth-client";
import { EmailSentNotice } from "./email-sent-notice";

export function MagicLinkPending() {
	return (
		<EmailSentNotice
			titleKey="auth:magicLink.pending.title"
			descriptionKey="auth:magicLink.pending.description"
			resendButtonKey="auth:magicLink.pending.resend"
			onResend={(email) =>
				authClient.signIn.magicLink({
					email,
					callbackURL: `${env.VITE_WEB_URL}/magic-link/verify`,
				})
			}
		/>
	);
}
