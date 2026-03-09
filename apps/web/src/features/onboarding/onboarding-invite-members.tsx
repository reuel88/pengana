import { useTranslation } from "@pengana/i18n";
import { useBatchInvite } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { Input } from "@pengana/ui/components/input";
import { useEffect } from "react";
import { toast } from "sonner";

import { useActiveOrg } from "@/hooks/use-org-queries";

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { data: activeOrg } = useActiveOrg();

	const {
		entries,
		addEntry,
		removeEntry,
		updateEntry,
		validEntries,
		handleSubmit,
		loading,
	} = useBatchInvite({
		organizationId: activeOrg?.id,
		onSuccess: () => {
			toast.success(t("invite.success"));
			onInvited();
		},
		onPartialFailure: () => toast.error(t("invite.error")),
		onError: () => toast.error(t("invite.error")),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: seed the first entry on mount
	useEffect(() => {
		if (entries.length === 0) {
			addEntry(crypto.randomUUID());
		}
	}, []);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleSubmit();
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>{t("invite.title")}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t("invite.description")}
				</p>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-3">
					{entries.map((entry, index) => (
						<div key={entry.id} className="flex items-center gap-2">
							<Input
								type="email"
								value={entry.email}
								onChange={(e) => updateEntry(index, { email: e.target.value })}
								placeholder={t("invite.emailPlaceholder")}
								className="flex-1"
							/>
							<select
								value={entry.role}
								onChange={(e) =>
									updateEntry(index, {
										role: e.target.value as "member" | "admin",
									})
								}
								className="rounded-md border px-2 py-2 text-sm"
							>
								<option value="member">{t("organization:roles.member")}</option>
								<option value="admin">{t("organization:roles.admin")}</option>
							</select>
							{entries.length > 1 && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => removeEntry(index)}
								>
									{t("invite.remove")}
								</Button>
							)}
						</div>
					))}
					<Button
						type="button"
						variant="outline"
						onClick={() => addEntry(crypto.randomUUID())}
					>
						{t("invite.addAnother")}
					</Button>
					<Button type="submit" disabled={loading || validEntries.length === 0}>
						{loading ? t("common:submitting") : t("invite.send")}
					</Button>
					<Button type="button" variant="ghost" onClick={onSkip}>
						{t("invite.skip")}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
