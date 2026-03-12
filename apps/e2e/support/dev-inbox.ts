import type { Page } from "@playwright/test";
import { DEV_INBOX_URL } from "./constants.js";

interface EmailSummary {
	id: number;
	to: string;
	subject: string;
}

interface EmailDetail {
	html: string;
}

export async function pollDevInbox(
	page: Page,
	email: string,
	subject: string,
	timeoutMs = 15_000,
	pollIntervalMs = 500,
): Promise<EmailDetail> {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const emailsResponse = await page.request.get(DEV_INBOX_URL);
		if (!emailsResponse.ok()) {
			throw new Error(
				`Failed to load dev inbox: ${emailsResponse.status()} ${emailsResponse.statusText()}`,
			);
		}

		const emails = (await emailsResponse.json()) as EmailSummary[];

		const match = emails.find(
			(message) => message.to === email && message.subject === subject,
		);

		if (match) {
			const detailResponse = await page.request.get(
				`${DEV_INBOX_URL}/${match.id}`,
			);
			if (!detailResponse.ok()) {
				throw new Error(
					`Failed to load dev email ${match.id}: ${detailResponse.status()} ${detailResponse.statusText()}`,
				);
			}

			return (await detailResponse.json()) as EmailDetail;
		}

		await page.waitForTimeout(pollIntervalMs);
	}

	throw new Error(
		`Timed out waiting for email with subject "${subject}" for ${email}.`,
	);
}

export function extractVerificationUrl(email: string, html: string): string {
	const match = html.match(
		/href="([^"]*\/verify-email\/callback\?token=[^"]+)"/i,
	);
	if (!match?.[1]) {
		throw new Error(
			`Verification email for ${email} did not contain a valid callback URL.`,
		);
	}
	return match[1];
}
