import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { Input } from "@pengana/ui/components/input";
import { useState } from "react";
import { toast } from "sonner";

import { useActiveOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";

interface InviteEntry {
	id: string;
	email: string;
	role: "member" | "admin";
}

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { data: activeOrg } = useActiveOrg();
	const [entries, setEntries] = useState<InviteEntry[]>([
		{ id: crypto.randomUUID(), email: "", role: "member" },
	]);
	const [loading, setLoading] = useState(false);

	const updateEntry = (index: number, updates: Partial<InviteEntry>) => {
		setEntries((prev) =>
			prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry)),
		);
	};

	const addEntry = () => {
		setEntries((prev) => [
			...prev,
			{ id: crypto.randomUUID(), email: "", role: "member" },
		]);
	};

	const removeEntry = (index: number) => {
		setEntries((prev) => prev.filter((_, i) => i !== index));
	};

	const validEntries = entries.filter((e) => e.email.trim() !== "");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeOrg || validEntries.length === 0) return;

		setLoading(true);
		try {
			const results = await Promise.allSettled(
				validEntries.map(async (entry) => {
					const { error } = await authClient.organization.inviteMember({
						email: entry.email.trim(),
						role: entry.role,
						organizationId: activeOrg.id,
					});
					if (error) throw error;
				}),
			);

			const failed = results.filter((r) => r.status === "rejected");
			if (failed.length > 0) {
				toast.error(t("invite.error"));
			}
			if (failed.length < results.length) {
				toast.success(t("invite.success"));
				onInvited();
			}
		} catch {
			toast.error(t("invite.error"));
		} finally {
			setLoading(false);
		}
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
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
					<Button type="button" variant="outline" onClick={addEntry}>
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
