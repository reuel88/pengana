import { parseWsMessage } from "@pengana/api/ws-types";
import { env } from "@pengana/env/web";
import { orgQueryKeys } from "@pengana/org-client";
import { createWebSocketRealtimeTransport } from "@pengana/realtime-transport";
import { notificationQueryKeys } from "@/features/notifications/entities/notification/query-keys";
import { queryClient } from "@/shared/api/orpc";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

export function createRealtimeTransport(
	_userId: string,
	callbacks: {
		onNotify: (kind: "sync" | "refresh") => void;
		onOpen?: () => void;
	},
) {
	return createWebSocketRealtimeTransport({
		getUrl: getWsUrl,
		decodeMessage: (data) => {
			const message = parseWsMessage(data);
			if (!message) return null;
			if (message.type === "sync-notify") return "sync";
			if (message.type === "refresh-notify") return "refresh";
			return "heartbeat";
		},
		onNotify: callbacks.onNotify,
		onOpen: callbacks.onOpen,
	});
}

export function onRefreshNotify() {
	queryClient.invalidateQueries({
		queryKey: notificationQueryKeys.list,
	});
	queryClient.invalidateQueries({
		queryKey: orgQueryKeys.userInvitations,
	});
}
