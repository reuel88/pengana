import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "@/shared/ui/loader";

export function VerifyEmailCallback() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { token } = useSearch({ strict: false });
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) {
			setError(t("auth:verifyEmail.invalidToken"));
			return;
		}

		// Raw fetch is intentional: better-auth's verify endpoint needs cookie
		// credentials and returns a plain 200/4xx — no SDK method wraps this.
		fetch(
			`${env.VITE_SERVER_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
			{ credentials: "include" },
		)
			.then((res) => {
				if (res.ok) {
					toast.success(t("auth:verifyEmail.success"));
					navigate({ to: "/" });
				} else {
					setError(t("auth:verifyEmail.invalidToken"));
				}
			})
			.catch(() => {
				setError(t("auth:verifyEmail.error"));
			});
	}, [token, navigate, t]);

	if (error) {
		return (
			<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
				<h1 className="mb-4 font-bold text-3xl">
					{t("auth:verifyEmail.title")}
				</h1>
				<p className="mb-4 text-muted-foreground">{error}</p>
				<Link
					to="/login"
					className="text-primary text-sm hover:text-primary/80"
				>
					{t("auth:verifyEmail.backToSignIn")}
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
			<Loader />
			<p className="mt-4 text-muted-foreground">
				{t("auth:verifyEmail.verifying")}
			</p>
		</div>
	);
}
