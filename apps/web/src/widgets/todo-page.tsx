import { useTranslation } from "@pengana/i18n";
import {
	createDexieMediaActions,
	getMediaCountForEntity,
} from "@pengana/local-db/media";
import {
	createDexieTodoActions,
	useTodoHandlers,
	useTodos,
} from "@pengana/local-db/todo";
import type { SyncDescriptor } from "@pengana/sync/runtime";
import {
	isAllowedMimeType,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SyncContextValue } from "@/features/sync/use-sync-entry";
import { useSyncEntry } from "@/features/sync/use-sync-entry";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { createIndexedDbFileStrategy } from "@/features/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

type Tab = "personal" | "organization";

function TodoContent({
	userId,
	scopeType,
	scopeId,
	organizationId,
	syncState,
	descriptor,
}: {
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	syncState: SyncContextValue;
	descriptor: SyncDescriptor;
}) {
	const { t } = useTranslation("todos");
	const { triggerSync, enqueueUpload } = syncState;

	const orgFilter = useMemo(() => {
		return (t: { organizationId: string; scopeType: "personal" | "org" }) =>
			t.scopeType === scopeType &&
			(!organizationId || t.organizationId === organizationId);
	}, [organizationId, scopeType]);
	const { todos } = useTodos({ db: appDb, scopeId, filter: orgFilter });

	const handleToastError = useCallback((id: string, message: string) => {
		console.log(id, message);
		toast.error(message);
	}, []);

	const actions = useMemo(() => createDexieTodoActions(appDb), []);

	const fileStorage = useMemo(() => createIndexedDbFileStrategy(appDb), []);
	const mediaActions = useMemo(() => createDexieMediaActions(appDb), []);

	const {
		handleAdd,
		handleToggle,
		handleResolve,
		handleDelete,

		handleFileSelected,
		handleRemoveAttachment,
		handleRetryAttachment,
	} = useTodoHandlers({
		t,
		actions,
		mediaActions,
		userId,
		scopeId,
		organizationId,
		scopeType,
		fileStorage,
	});

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner
				isOnline={syncState.isOnline}
				isSyncing={syncState.isSyncing}
			/>
			<TodoInputBase
				onSubmit={async (title) => {
					const result = await handleAdd(title);
					if (result.success) {
						triggerSync();
					} else {
						toast.error(result.error);
					}
				}}
				onError={(error) => {
					console.error("Error occurred", error);
					toast.error(t("error"));
				}}
			/>

			<TodoListBase
				todos={todos}
				onToggle={async (id) => {
					const result = await handleToggle(id);
					if (result.success) {
						triggerSync();
					} else {
						toast.error(result.error);
					}
				}}
				onDelete={async (id) => {
					const result = await handleDelete(id);
					if (result.success) {
						toast.success(t("delete.success"));
						triggerSync();
					} else {
						toast.error(result.error);
					}
				}}
				onResolve={async (id, resolution) => {
					const result = await handleResolve(id, resolution);
					if (result.success) {
						triggerSync();
					} else {
						toast.error(result.error);
					}
				}}
				onFilesSelected={async (files, target) => {
					const currentCount = await getMediaCountForEntity(
						appDb,
						target.entityId,
					);
					const available = Math.max(0, MAX_ATTACHMENTS - currentCount);
					const sliced = files.slice(0, available);
					let enqueued = false;
					for (const file of sliced) {
						const result = await handleFileSelected(file, target);
						if (result.success) {
							enqueueUpload(result.data);
							enqueued = true;
						} else {
							toast.error(result.error);
						}
					}
					if (enqueued) {
						triggerSync();
					}
				}}
				onRemoveAttachment={async (todoId, mediaId) => {
					const result = await handleRemoveAttachment(todoId, mediaId);
					if (result.success) {
						try {
							await client.upload.deleteMedia({ mediaId });
						} catch {
							// server-side cleanup failed; local removal already succeeded
						}
						triggerSync();
					} else {
						toast.error(result.error);
					}
				}}
				onRetryAttachment={async (_todoId, mediaId) => {
					const result = await handleRetryAttachment(mediaId);
					if (result.success && result.data) {
						enqueueUpload(result.data);
						triggerSync();
					} else if (!result.success) {
						toast.error(result.error);
					}
				}}
				onValidationError={handleToastError}
				validateFile={(file) => {
					if (!isAllowedMimeType(file.type)) return t("errors:invalidFileType");
					if (file.size > MAX_FILE_SIZE_BYTES) return t("errors:fileTooLarge");
					return null;
				}}
				maxAttachments={MAX_ATTACHMENTS}
			/>

			<SyncDevtools descriptor={descriptor} />
		</div>
	);
}

function PersonalTodoContent({
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
		<TodoContent
			userId={userId}
			scopeId={userId}
			organizationId={organizationId}
			scopeType="personal"
			syncState={sync}
			descriptor={descriptor}
		/>
	);
}

function OrgTodoContent({
	organizationId,
	userId,
}: {
	organizationId: string;
	userId: string;
}) {
	const descriptor: SyncDescriptor = useMemo(
		() => ({
			scopeType: "organization",
			scopeId: organizationId,
			entityKey: "sync",
		}),
		[organizationId],
	);
	const sync = useSyncEntry(descriptor);

	return (
		<TodoContent
			userId={userId}
			scopeId={organizationId}
			organizationId={organizationId}
			scopeType="org"
			syncState={sync}
			descriptor={descriptor}
		/>
	);
}

export function TodoPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const { t } = useTranslation("todos");
	const [activeTab, setActiveTab] = useState<Tab>("personal");

	return (
		<div
			className="mx-auto flex max-w-lg flex-col gap-4 p-4"
			data-testid="todo-page"
		>
			<h1 className="font-bold text-xl">{t("title")}</h1>

			<div className="flex gap-2 border-b" role="tablist">
				{(
					[
						{ key: "personal", label: t("tabs.personal") },
						{ key: "organization", label: t("tabs.organization") },
					] as const
				).map(({ key, label }) => (
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
					<PersonalTodoContent
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
					<OrgTodoContent userId={userId} organizationId={organizationId} />
				</div>
			)}
		</div>
	);
}
