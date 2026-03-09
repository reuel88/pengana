import type { BackgroundMessage } from "./background-messages";

/**
 * Type-safe wrapper around `browser.runtime.sendMessage` for messages
 * sent from the popup/content scripts to the background service worker.
 */
export function sendBackgroundMessage<R = unknown>(
	message: BackgroundMessage,
): Promise<R> {
	return browser.runtime.sendMessage(message);
}
