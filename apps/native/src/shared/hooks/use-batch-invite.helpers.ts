export type BatchInviteEntry = { email: string; role: "member" | "admin" };

export type BatchInviteFailure = BatchInviteEntry & {
	reason?: "missing-organization";
};

export type BatchInviteResult = {
	successes: BatchInviteEntry[];
	failures: BatchInviteFailure[];
};

type BatchInvitePostProcessing = {
	result: BatchInviteResult;
	totalCount: number;
	invalidateActiveOrg: () => Promise<unknown>;
	onSuccess?: () => void;
	onError?: (message: string) => void;
	logError?: (...args: unknown[]) => void;
};

function logPostProcessingError(
	logError: (...args: unknown[]) => void,
	error: unknown,
) {
	logError("Failed during batch invite post-processing:", error);
}

function notifyPostProcessingFailure({
	error,
	onError,
	logError,
}: {
	error: unknown;
	onError?: (message: string) => void;
	logError: (...args: unknown[]) => void;
}) {
	logPostProcessingError(logError, error);

	try {
		onError?.("Failed to send invitations");
	} catch (callbackError) {
		logPostProcessingError(logError, callbackError);
	}
}

export async function runBatchInvitePostProcessing({
	result,
	totalCount,
	invalidateActiveOrg,
	onSuccess,
	onError,
	logError = console.error,
}: BatchInvitePostProcessing): Promise<BatchInviteResult> {
	if (result.successes.length > 0) {
		try {
			await invalidateActiveOrg();
		} catch (error) {
			notifyPostProcessingFailure({ error, onError, logError });
			return result;
		}
	}

	if (result.failures.length === totalCount) {
		try {
			onError?.("All invitations failed");
		} catch (error) {
			logPostProcessingError(logError, error);
		}

		return result;
	}

	if (result.failures.length === 0) {
		try {
			onSuccess?.();
		} catch (error) {
			notifyPostProcessingFailure({ error, onError, logError });
		}
	}

	return result;
}
