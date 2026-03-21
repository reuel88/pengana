import { useTranslation } from "@pengana/i18n";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import {
	createDexieMediaActions,
	orgMediaConfig,
	personalMediaConfig,
	storeFileInDexie,
	useMedia,
	useMediaListWiring,
} from "@pengana/upload-client";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
	OrgSyncProvider,
	SyncProvider,
	useOrgSync,
	useSync,
} from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

import { DropZone } from "./drop-zone";
import { MediaGrid } from "./media-grid";

type Tab = "personal" | "organization";

function createIndexedDbFileStrategy() {
	return {
		async storeFile(id: string, file: File) {
			await storeFileInDexie(appDb, id, file);
		},
		createFileRef(id: string, _file: File) {
			return { uri: `indexeddb://${id}` };
		},
	};
}

function MediaContent({
	userId,
	scopeId,
	organizationId,
	scopeType,
	syncState,
}: {
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
	syncState: ReturnType<typeof useSync>;
}) {
	const { t } = useTranslation("media");
	const { isOnline, isSyncing, enqueueUpload, triggerSync } = syncState;

	const { media } = useMedia({
		db: appDb,
		config: scopeType === "org" ? orgMediaConfig : personalMediaConfig,
		scopeId,
	});

	const fileStorage = useMemo(() => createIndexedDbFileStrategy(), []);
	const actions = useMemo(() => createDexieMediaActions(appDb), []);

	const { handleDelete, handleFilesSelected } = useMediaListWiring({
		actions,
		triggerSync,
		enqueueUpload,
		userId,
		scopeId,
		organizationId,
		config: scopeType === "org" ? orgMediaConfig : personalMediaConfig,
		fileStorage,
		t,
		deleteMedia: (mediaId) => client.upload.deleteMedia({ mediaId }),
		onError: (id, message) => {
			console.log(id, message);
			toast.error(message);
		},
		onDeleteSuccess: () => {
			toast.success(t("delete.success"));
		},
	});

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<DropZone
				onFiles={(files) => {
					void handleFilesSelected(files);
				}}
				idleLabel={t("dropzone.idle")}
				activeLabel={t("dropzone.active")}
			/>
			<MediaGrid media={media} t={t} onDelete={handleDelete} />
			<SyncDevtools />
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
	const syncState = useSync();

	return (
		<MediaContent
			userId={userId}
			scopeId={userId}
			organizationId={organizationId}
			scopeType="personal"
			syncState={syncState}
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
	const syncState = useOrgSync();

	return (
		<MediaContent
			userId={userId}
			scopeId={organizationId}
			organizationId={organizationId}
			scopeType="org"
			syncState={syncState}
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
				<SyncProvider userId={userId} organizationId={organizationId}>
					<div
						id="panel-personal"
						role="tabpanel"
						aria-labelledby="tab-personal"
					>
						<PersonalMediaContent
							userId={userId}
							organizationId={organizationId}
						/>
					</div>
				</SyncProvider>
			)}

			{activeTab === "organization" && (
				<OrgSyncProvider organizationId={organizationId} userId={userId}>
					<div
						id="panel-organization"
						role="tabpanel"
						aria-labelledby="tab-organization"
					>
						<OrgMediaContent userId={userId} organizationId={organizationId} />
					</div>
				</OrgSyncProvider>
			)}
		</div>
	);
}
