import { useTranslation } from "@pengana/i18n";
import type { LocalMedia } from "@pengana/upload-client";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";

import { SyncProvider } from "@/features/sync/sync-context";
import { client, queryClient } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

import { DropZone } from "./drop-zone";
import { MediaGrid } from "./media-grid";
import { useStandaloneUpload } from "./use-standalone-upload";

function MediaContent({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId?: string;
}) {
	const { t } = useTranslation("media");

	const { data: serverMedia, refetch } = useQuery({
		queryKey: ["media", "list", organizationId],
		queryFn: async () => {
			const res = await client.media.listMedia({});
			return res.data;
		},
	});

	const localMedia =
		useLiveQuery(
			() => appDb.getTable<LocalMedia>("media").where({ userId }).toArray(),
			[userId],
		) ?? [];

	const invalidateList = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: ["media", "list"] });
		refetch();
	}, [refetch]);

	const { uploadFiles } = useStandaloneUpload({
		userId,
		organizationId,
		t,
		onUploadEnqueued: invalidateList,
	});

	return (
		<div className="flex flex-col gap-4">
			<DropZone
				onFiles={uploadFiles}
				idleLabel={t("dropzone.idle")}
				activeLabel={t("dropzone.active")}
			/>
			<MediaGrid
				serverMedia={serverMedia ?? []}
				localMedia={localMedia}
				t={t}
				onDeleted={invalidateList}
			/>
		</div>
	);
}

export function MediaPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId?: string;
}) {
	const { t } = useTranslation("media");

	return (
		<div
			className="mx-auto flex max-w-2xl flex-col gap-4 p-4"
			data-testid="media-page"
		>
			<h1 className="font-bold text-xl">{t("title")}</h1>
			<SyncProvider userId={userId} organizationId={organizationId}>
				<MediaContent userId={userId} organizationId={organizationId} />
			</SyncProvider>
		</div>
	);
}
