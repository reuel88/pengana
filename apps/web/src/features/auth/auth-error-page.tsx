import { useTranslation } from "@pengana/i18n";
import { Link, useSearch } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";

const ERROR_MAP: Record<string, string> = {
	oauth_error: "auth:authError.oauthFailed",
	unauthorized: "auth:authError.unauthorized",
	rate_limited: "auth:authError.rateLimited",
};

export function AuthErrorPage() {
	const { t } = useTranslation();
	const { error, message } = useSearch({ strict: false });

	const errorKey = error ? ERROR_MAP[error] : undefined;
	const displayMessage =
		message || (errorKey ? t(errorKey) : t("auth:authError.generic"));

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
			<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<CircleAlert className="h-8 w-8 text-destructive" />
			</div>
			<h1 className="mb-2 font-bold text-3xl">{t("auth:authError.title")}</h1>
			<p className="mb-6 text-muted-foreground">{displayMessage}</p>
			<Link to="/login" className="text-primary text-sm hover:text-primary/80">
				{t("auth:authError.backToSignIn")}
			</Link>
		</div>
	);
}
