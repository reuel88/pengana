import { useTranslation } from "@pengana/i18n";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";
import { Loader } from "@/shared/ui/loader";

export function MagicLinkCallback() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		authClient
			.getSession()
			.then((res) => {
				if (res.data?.session) {
					toast.success(t("auth:signIn.success"));
					navigate({ to: "/" });
				} else {
					setError(t("auth:verifyEmail.invalidToken"));
				}
			})
			.catch(() => {
				setError(t("auth:verifyEmail.invalidToken"));
			});
	}, [navigate, t]);

	if (error) {
		return (
			<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
				<h1 className="mb-4 font-bold text-3xl">{t("auth:magicLink.title")}</h1>
				<p className="mb-4 text-muted-foreground">{error}</p>
				<Link
					to="/magic-link"
					className="text-primary text-sm hover:text-primary/80"
				>
					{t("auth:magicLink.switchToPassword")}
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
			<Loader />
			<p className="mt-4 text-muted-foreground">
				{t("auth:magicLink.verifying")}
			</p>
		</div>
	);
}
