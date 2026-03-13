import { afterEach, describe, expect, it, vi } from "vitest";

import {
	resetSharedNotifyChannels,
	subscribeToSharedNotifyChannel,
} from "./shared-notify-manager";
import type { CreateNotifyTransport, RealtimeTransport } from "./types";

function createFakeTransport() {
	const transport: RealtimeTransport = {
		start: vi.fn(),
		stop: vi.fn(),
		getStatus: () => "idle",
		subscribe: () => () => {},
	};

	return transport;
}

describe("shared notify manager", () => {
	afterEach(() => {
		resetSharedNotifyChannels();
	});

	it("shares one transport across subscribers with the same notify key", () => {
		const transport = createFakeTransport();
		let callbacks:
			| {
					onNotify: () => void;
					onOpen?: () => void;
			  }
			| undefined;
		const createNotifyTransport = vi.fn(((notifyKey, nextCallbacks) => {
			expect(notifyKey).toBe("user-1");
			callbacks = nextCallbacks;
			return transport;
		}) satisfies CreateNotifyTransport);

		const onNotifyA = vi.fn();
		const onNotifyB = vi.fn();
		const onOpenA = vi.fn();
		const onOpenB = vi.fn();

		const subscriptionA = subscribeToSharedNotifyChannel({
			notifyKey: "user-1",
			createNotifyTransport,
			enabled: true,
			onNotify: onNotifyA,
			onOpen: onOpenA,
		});
		const subscriptionB = subscribeToSharedNotifyChannel({
			notifyKey: "user-1",
			createNotifyTransport,
			enabled: true,
			onNotify: onNotifyB,
			onOpen: onOpenB,
		});

		expect(createNotifyTransport).toHaveBeenCalledTimes(1);

		callbacks?.onOpen?.();
		callbacks?.onNotify();

		expect(onOpenA).toHaveBeenCalledTimes(1);
		expect(onOpenB).toHaveBeenCalledTimes(1);
		expect(onNotifyA).toHaveBeenCalledTimes(1);
		expect(onNotifyB).toHaveBeenCalledTimes(1);

		subscriptionA.unsubscribe();
		subscriptionB.unsubscribe();
		expect(transport.stop).toHaveBeenCalled();
	});

	it("only notifies enabled subscribers and stops when the last enabled subscriber is disabled", () => {
		const transport = createFakeTransport();
		let callbacks:
			| {
					onNotify: () => void;
					onOpen?: () => void;
			  }
			| undefined;
		const createNotifyTransport = vi.fn(((_notifyKey, nextCallbacks) => {
			callbacks = nextCallbacks;
			return transport;
		}) satisfies CreateNotifyTransport);

		const onNotifyEnabled = vi.fn();
		const onNotifyDisabled = vi.fn();

		const enabledSubscription = subscribeToSharedNotifyChannel({
			notifyKey: "user-1",
			createNotifyTransport,
			enabled: true,
			onNotify: onNotifyEnabled,
		});
		const disabledSubscription = subscribeToSharedNotifyChannel({
			notifyKey: "user-1",
			createNotifyTransport,
			enabled: false,
			onNotify: onNotifyDisabled,
		});

		callbacks?.onNotify();
		expect(onNotifyEnabled).toHaveBeenCalledTimes(1);
		expect(onNotifyDisabled).not.toHaveBeenCalled();

		enabledSubscription.setEnabled(false);
		expect(transport.stop).toHaveBeenCalled();

		disabledSubscription.setEnabled(true);
		callbacks?.onNotify();
		expect(onNotifyDisabled).toHaveBeenCalledTimes(1);

		enabledSubscription.unsubscribe();
		disabledSubscription.unsubscribe();
	});
});
