import { useTranslation } from "@pengana/i18n";
import {
	createDexieMediaActions,
	useMedia,
	useMediaHandlers,
} from "@pengana/local-db/media";
import type { SyncDescriptor } from "@pengana/sync/runtime";
import { ALLOWED_MIME_TYPES } from "@pengana/sync/upload";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { DropZone } from "@pengana/ui/components/drop-zone";
import { MediaGridList } from "@pengana/ui/components/media-grid-list";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SyncContextValue } from "@/features/sync/use-sync-entry";
import { useSyncEntry } from "@/features/sync/use-sync-entry";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { createIndexedDbFileStrategy } from "@/features/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

type Tab = "personal" | "organization";

function MediaContent({
	userId,
	scopeType,
	scopeId,
	organizationId,
	syncState,
	descriptor,
}: {
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
	syncState: SyncContextValue;
	descriptor: SyncDescriptor;
}) {
	const { t } = useTranslation("media");
	const { enqueueUpload, triggerSync } = syncState;

	const orgFilter = useMemo(() => {
		return (t: { organizationId: string; scopeType: "personal" | "org" }) =>
			t.scopeType === scopeType &&
			(!organizationId || t.organizationId === organizationId);
	}, [organizationId, scopeType]);
	const { media } = useMedia({
		db: appDb,
		scopeId,
		filter: orgFilter,
	});

	const fileStorage = useMemo(() => createIndexedDbFileStrategy(appDb), []);
	const actions = useMemo(() => createDexieMediaActions(appDb), []);

	const { handleFileSelected, handleDelete } = useMediaHandlers({
		t,
		actions,
		userId,
		scopeId,
		organizationId,
		scopeType,
		fileStorage,
	});

	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

	const onDelete = useCallback(
		async (mediaId: string) => {
			setDeletingIds((prev) => new Set(prev).add(mediaId));
			try {
				const result = await handleDelete(mediaId);
				if (result.success) {
					toast.success(t("delete.success"));
					try {
						await client.upload.deleteMedia({ mediaId });
					} catch {
						// server-side cleanup failed; local removal already succeeded
					}
				} else {
					toast.error(result.error);
				}
				triggerSync();
			} finally {
				setDeletingIds((prev) => {
					const next = new Set(prev);
					next.delete(mediaId);
					return next;
				});
			}
		},
		[handleDelete, triggerSync, t],
	);

	const visibleMedia = media.filter((item) => !deletingIds.has(item.id));

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner
				isOnline={syncState.isOnline}
				isSyncing={syncState.isSyncing}
			/>
			<DropZone
				accept={[...ALLOWED_MIME_TYPES]}
				onFiles={async (files) => {
					for (const file of files) {
						const result = await handleFileSelected(file);
						if (result.success) {
							enqueueUpload(result.data);
						} else {
							toast.error(result.error);
						}
					}
					triggerSync();
				}}
				onError={(error) => {
					console.error("File processing error:", error);
					toast.error(t("upload.error"));
				}}
			/>

			<MediaGridList media={visibleMedia} onDelete={onDelete} />

			<SyncDevtools descriptor={descriptor} />
		</div>
	);
}

function PersonalMediaContent({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const descriptor: SyncDescriptor = useMemo(
		() => ({ scopeType: "personal", scopeId: userId, entityKey: "sync" }),
		[userId],
	);
	const sync = useSyncEntry(descriptor);

	return (
		<MediaContent
			userId={userId}
			scopeId={userId}
			organizationId={organizationId}
			scopeType="personal"
			syncState={sync}
			descriptor={descriptor}
		/>
	);
}

function OrgMediaContent({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const descriptor: SyncDescriptor = useMemo(
		() => ({
			scopeType: "organization",
			scopeId: organizationId,
			entityKey: "sync",
		}),
		[organizationId],
	);
	const syncState = useSyncEntry(descriptor);

	return (
		<MediaContent
			userId={userId}
			scopeId={organizationId}
			organizationId={organizationId}
			scopeType="org"
			syncState={syncState}
			descriptor={descriptor}
		/>
	);
}

export function MediaPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const { t } = useTranslation("media");
	const [activeTab, setActiveTab] = useState<Tab>("personal");

	return (
		<div
			className="mx-auto flex max-w-2xl flex-col gap-4 p-4"
			data-testid="media-page"
		>
			<h1 className="font-bold text-xl">{t("title")}</h1>

			<div className="flex gap-2 border-b" role="tablist">
				{[
					{ key: "personal" as const, label: t("tabs.personal") },
					{ key: "organization" as const, label: t("tabs.organization") },
				].map(({ key, label }) => (
					<button
						key={key}
						id={`tab-${key}`}
						type="button"
						role="tab"
						aria-selected={activeTab === key}
						aria-controls={`panel-${key}`}
						className={`px-3 py-2 font-medium text-sm ${
							activeTab === key ? "border-current border-b-2" : "opacity-60"
						}`}
						onClick={() => setActiveTab(key)}
					>
						{label}
					</button>
				))}
			</div>

			{activeTab === "personal" && (
				<div id="panel-personal" role="tabpanel" aria-labelledby="tab-personal">
					<PersonalMediaContent
						userId={userId}
						organizationId={organizationId}
					/>
				</div>
			)}

			{activeTab === "organization" && (
				<div
					id="panel-organization"
					role="tabpanel"
					aria-labelledby="tab-organization"
				>
					<OrgMediaContent userId={userId} organizationId={organizationId} />
				</div>
			)}
		</div>
	);
}
