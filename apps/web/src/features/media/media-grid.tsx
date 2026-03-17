import { Skeleton } from "@pengana/ui/components/skeleton";
import type { LocalMedia } from "@pengana/upload-client";
import { removeMedia } from "@pengana/upload-client";
import { useCallback } from "react";
import { toast } from "sonner";

import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

interface ServerMedia {
	id: string;
	url: string | null;
	mimeType: string;
	createdAt: string;
	updatedAt: string;
	attachments: { entityType: string }[];
}

interface MediaGridProps {
	serverMedia: ServerMedia[];
	localMedia: LocalMedia[];
	t: (key: string) => string;
	onDeleted: () => void;
}

function isPdf(mimeType: string) {
	return mimeType === "application/pdf";
}

function statusDotClass(status: string | null): string {
	switch (status) {
		case "queued":
		case "uploading":
			return "animate-pulse bg-yellow-500";
		case "uploaded":
			return "bg-green-500";
		case "failed":
			return "bg-red-500";
		default:
			return "bg-gray-400";
	}
}

function sourceBadge(
	attachments: { entityType: string }[],
	t: (key: string) => string,
) {
	if (attachments.length === 0) return t("source.standalone");
	return attachments.map((a) => a.entityType).join(", ");
}

export function MediaGrid({
	serverMedia,
	localMedia,
	t,
	onDeleted,
}: MediaGridProps) {
	const handleDelete = useCallback(
		async (mediaId: string) => {
			try {
				await Promise.all([
					client.upload.deleteMedia({ mediaId }),
					removeMedia(appDb, mediaId),
				]);
				toast.success(t("delete.success"));
				onDeleted();
			} catch {
				toast.error(t("upload.error"));
			}
		},
		[t, onDeleted],
	);

	// Merge: server media + local-only (pending) media
	const serverIds = new Set(serverMedia.map((m) => m.id));
	const pendingLocal = localMedia.filter((m) => !serverIds.has(m.id));

	const allItems: {
		id: string;
		url: string | null;
		localUri: string | null;
		mimeType: string;
		status: string | null;
		attachments: { entityType: string }[];
		isLocal: boolean;
	}[] = [
		...pendingLocal.map((m) => ({
			id: m.id,
			url: m.url,
			localUri: m.localUri,
			mimeType: m.mimeType,
			status: m.status,
			attachments: [] as { entityType: string }[],
			isLocal: true,
		})),
		...serverMedia.map((m) => ({
			id: m.id,
			url: m.url,
			localUri: null,
			mimeType: m.mimeType,
			status: "uploaded" as const,
			attachments: m.attachments,
			isLocal: false,
		})),
	];

	if (allItems.length === 0) {
		return (
			<p className="py-8 text-center text-sm opacity-60">{t("grid.empty")}</p>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{allItems.map((item) => {
				const src = item.url;

				return (
					<div
						key={item.id}
						className="group relative flex flex-col items-center gap-1 rounded-lg border p-2"
					>
						{isPdf(item.mimeType) ? (
							<div className="flex h-24 w-full items-center justify-center rounded bg-gray-100 text-2xl dark:bg-gray-800">
								PDF
							</div>
						) : src ? (
							<img
								src={src}
								alt=""
								className="h-24 w-full rounded object-cover"
							/>
						) : (
							<Skeleton className="h-24 w-full" />
						)}

						<div className="flex w-full items-center gap-1.5 text-xs">
							<span
								className={`size-2 shrink-0 rounded-full ${statusDotClass(item.status)}`}
							/>
							<span className="truncate opacity-60">
								{sourceBadge(item.attachments, t)}
							</span>
						</div>

						{!item.isLocal && (
							<button
								type="button"
								className="absolute top-1 right-1 hidden rounded bg-red-500 px-1.5 py-0.5 text-white text-xs group-hover:block"
								onClick={() => handleDelete(item.id)}
							>
								{t("actions.delete")}
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}
