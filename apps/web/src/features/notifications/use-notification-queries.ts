import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { notificationQueryKeys } from "@/features/notifications/entities/notification/query-keys";
import { client } from "@/shared/api/orpc";

const STALE_TIME = 30_000;

export function useNotifications() {
	return useQuery({
		queryKey: notificationQueryKeys.list,
		queryFn: async () => {
			const result = await client.notification.list();
			return result.data;
		},
		staleTime: STALE_TIME,
	});
}

export function useInvalidateNotifications() {
	const queryClient = useQueryClient();

	const invalidateNotifications = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.list,
			}),
		[queryClient],
	);

	return { invalidateNotifications };
}
