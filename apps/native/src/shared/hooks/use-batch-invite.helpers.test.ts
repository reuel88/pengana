import { describe, expect, it, vi } from "vitest";

import {
	type BatchInviteResult,
	runBatchInvitePostProcessing,
} from "./use-batch-invite.helpers";

describe("runBatchInvitePostProcessing", () => {
	const entryA = { email: "a@example.com", role: "member" as const };
	const entryB = { email: "b@example.com", role: "admin" as const };

	it("preserves computed results when invalidation fails", async () => {
		const result: BatchInviteResult = {
			successes: [entryA],
			failures: [entryB],
		};
		const onError = vi.fn();
		const logError = vi.fn();

		const output = await runBatchInvitePostProcessing({
			result,
			totalCount: 2,
			invalidateActiveOrg: vi.fn().mockRejectedValue(new Error("boom")),
			onError,
			logError,
		});

		expect(output).toEqual(result);
		expect(onError).toHaveBeenCalledWith("Failed to send invitations");
		expect(logError).toHaveBeenCalledWith(
			"Failed during batch invite post-processing:",
			expect.any(Error),
		);
	});

	it("preserves all-success results when onSuccess throws", async () => {
		const result: BatchInviteResult = {
			successes: [entryA, entryB],
			failures: [],
		};
		const onError = vi.fn();
		const logError = vi.fn();

		const output = await runBatchInvitePostProcessing({
			result,
			totalCount: 2,
			invalidateActiveOrg: vi.fn().mockResolvedValue(undefined),
			onSuccess: vi.fn(() => {
				throw new Error("callback failed");
			}),
			onError,
			logError,
		});

		expect(output).toEqual(result);
		expect(onError).toHaveBeenCalledWith("Failed to send invitations");
		expect(logError).toHaveBeenCalledWith(
			"Failed during batch invite post-processing:",
			expect.any(Error),
		);
	});

	it("preserves all-failure results when onError throws", async () => {
		const result: BatchInviteResult = {
			successes: [],
			failures: [entryA, entryB],
		};
		const logError = vi.fn();

		const output = await runBatchInvitePostProcessing({
			result,
			totalCount: 2,
			invalidateActiveOrg: vi.fn().mockResolvedValue(undefined),
			onError: vi.fn(() => {
				throw new Error("alert failed");
			}),
			logError,
		});

		expect(output).toEqual(result);
		expect(logError).toHaveBeenCalledWith(
			"Failed during batch invite post-processing:",
			expect.any(Error),
		);
	});
});
