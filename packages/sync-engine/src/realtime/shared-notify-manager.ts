import type {
	CreateNotifyTransport,
	NotifyTransportCallbacks,
	RealtimeTransport,
} from "./types";

interface NotifySubscriber extends NotifyTransportCallbacks {
	enabled: boolean;
}

interface SharedNotifyChannel {
	transport: RealtimeTransport;
	subscribers: Map<number, NotifySubscriber>;
}

interface SharedNotifySubscription {
	setEnabled(enabled: boolean): void;
	unsubscribe(): void;
}

const channels = new Map<string, SharedNotifyChannel>();
let nextSubscriberId = 1;

function broadcast(
	channel: SharedNotifyChannel,
	handler: keyof NotifyTransportCallbacks,
) {
	for (const subscriber of channel.subscribers.values()) {
		if (!subscriber.enabled) continue;
		subscriber[handler]?.();
	}
}

function createChannel(
	notifyKey: string,
	createNotifyTransport: CreateNotifyTransport,
): SharedNotifyChannel {
	const channel: SharedNotifyChannel = {
		transport: createNotifyTransport(notifyKey, {
			onNotify: () => broadcast(channel, "onNotify"),
			onOpen: () => broadcast(channel, "onOpen"),
		}),
		subscribers: new Map(),
	};

	return channel;
}

function reconcileChannel(channel: SharedNotifyChannel) {
	const hasEnabledSubscribers = [...channel.subscribers.values()].some(
		(subscriber) => subscriber.enabled,
	);

	if (hasEnabledSubscribers) {
		channel.transport.start();
		return;
	}

	channel.transport.stop();
}

export function subscribeToSharedNotifyChannel({
	notifyKey,
	createNotifyTransport,
	onNotify,
	onOpen,
	enabled,
}: {
	notifyKey: string;
	createNotifyTransport: CreateNotifyTransport;
	onNotify: () => void;
	onOpen?: () => void;
	enabled: boolean;
}): SharedNotifySubscription {
	const channel =
		channels.get(notifyKey) ?? createChannel(notifyKey, createNotifyTransport);
	channels.set(notifyKey, channel);

	const subscriberId = nextSubscriberId++;
	channel.subscribers.set(subscriberId, {
		onNotify,
		onOpen,
		enabled,
	});
	reconcileChannel(channel);

	return {
		setEnabled(nextEnabled) {
			const subscriber = channel.subscribers.get(subscriberId);
			if (!subscriber) return;
			subscriber.enabled = nextEnabled;
			reconcileChannel(channel);
		},
		unsubscribe() {
			channel.subscribers.delete(subscriberId);
			if (channel.subscribers.size === 0) {
				channel.transport.stop();
				channels.delete(notifyKey);
				return;
			}
			reconcileChannel(channel);
		},
	};
}

export function resetSharedNotifyChannels() {
	for (const channel of channels.values()) {
		channel.transport.stop();
	}
	channels.clear();
	nextSubscriberId = 1;
}
