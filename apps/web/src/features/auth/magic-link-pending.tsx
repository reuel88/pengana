import { env } from "@pengana/env/web";
import { authClient } from "@/shared/lib/auth-client";
import { PendingEmailPage } from "./pending-email-page";

export function MagicLinkPending() {
	return (
		<PendingEmailPage
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
