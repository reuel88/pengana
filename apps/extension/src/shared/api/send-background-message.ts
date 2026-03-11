import type {
	BackgroundMessage,
	MessageResponseMap,
} from "./background-messages";

/**
 * Type-safe wrapper around `browser.runtime.sendMessage` for messages
 * sent from the popup/content scripts to the background service worker.
 */
export function sendBackgroundMessage<T extends BackgroundMessage>(
	message: T,
): Promise<MessageResponseMap[T["type"]]> {
	return browser.runtime.sendMessage(message);
}
