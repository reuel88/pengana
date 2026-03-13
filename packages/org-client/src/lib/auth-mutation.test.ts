import { describe, expect, it, vi } from "vitest";
import { authMutation } from "./auth-mutation";

describe("authMutation", () => {
	it("calls onSuccess with data on success", async () => {
		const onSuccess = vi.fn();
		await authMutation({
			mutationFn: async () => ({ data: "result" }),
			errorMessage: "failed",
			onSuccess,
		});
		expect(onSuccess).toHaveBeenCalledWith("result");
	});

	it("calls notify.success with successMessage on success", async () => {
		const notify = { success: vi.fn(), error: vi.fn() };
		await authMutation({
			mutationFn: async () => ({ data: null }),
			successMessage: "Done!",
			errorMessage: "failed",
			notify,
		});
		expect(notify.success).toHaveBeenCalledWith("Done!");
	});

	it("does not call notify.success when successMessage is not provided", async () => {
		const notify = { success: vi.fn(), error: vi.fn() };
		await authMutation({
			mutationFn: async () => ({ data: null }),
			errorMessage: "failed",
			notify,
		});
		expect(notify.success).not.toHaveBeenCalled();
	});

	it("calls notify.error when mutationFn returns an error", async () => {
		const notify = { success: vi.fn(), error: vi.fn() };
		await authMutation({
			mutationFn: async () => ({ error: { message: "Server error" } }),
			errorMessage: "fallback error",
			notify,
		});
		expect(notify.error).toHaveBeenCalledWith("Server error");
	});

	it("uses errorMessage when error has no message", async () => {
		const notify = { success: vi.fn(), error: vi.fn() };
		await authMutation({
			mutationFn: async () => ({ error: {} }),
			errorMessage: "fallback error",
			notify,
		});
		expect(notify.error).toHaveBeenCalledWith("fallback error");
	});

	it("calls onError when mutationFn returns an error and no notify", async () => {
		const onError = vi.fn();
		await authMutation({
			mutationFn: async () => ({ error: { message: "oops" } }),
			errorMessage: "fallback",
			onError,
		});
		expect(onError).toHaveBeenCalledWith("oops");
	});

	it("uses fallback error when preferServerErrorMessage is false", async () => {
		const onError = vi.fn();
		await authMutation({
			mutationFn: async () => ({ error: { message: "user already exists" } }),
			errorMessage: "Failed to send invitation",
			preferServerErrorMessage: false,
			onError,
		});
		expect(onError).toHaveBeenCalledWith("Failed to send invitation");
	});

	it("calls notify.error when mutationFn throws", async () => {
		const notify = { success: vi.fn(), error: vi.fn() };
		await authMutation({
			mutationFn: async () => {
				throw new Error("network error");
			},
			errorMessage: "Request failed",
			notify,
		});
		expect(notify.error).toHaveBeenCalledWith("Request failed");
	});

	it("calls onError when mutationFn throws and no notify", async () => {
		const onError = vi.fn();
		await authMutation({
			mutationFn: async () => {
				throw new Error("network error");
			},
			errorMessage: "Request failed",
			onError,
		});
		expect(onError).toHaveBeenCalledWith("Request failed");
	});

	it("sets loading true before and false after on success", async () => {
		const setLoading = vi.fn();
		const order: boolean[] = [];
		setLoading.mockImplementation((v: boolean) => order.push(v));
		await authMutation({
			mutationFn: async () => ({ data: null }),
			errorMessage: "failed",
			setLoading,
		});
		expect(order).toEqual([true, false]);
	});

	it("sets loading true before and false after on failure", async () => {
		const setLoading = vi.fn();
		const order: boolean[] = [];
		setLoading.mockImplementation((v: boolean) => order.push(v));
		await authMutation({
			mutationFn: async () => {
				throw new Error("fail");
			},
			errorMessage: "failed",
			setLoading,
		});
		expect(order).toEqual([true, false]);
	});

	it("works without optional callbacks", async () => {
		await expect(
			authMutation({
				mutationFn: async () => ({ data: null }),
				errorMessage: "failed",
			}),
		).resolves.toBe(true);
	});
});
