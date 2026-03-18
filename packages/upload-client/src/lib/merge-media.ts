import type { LocalMedia, LocalMediaAttachment } from "./db";

export interface ServerMediaRecord {
	id: string;
	userId: string;
	url: string | null;
	mimeType: string;
	createdAt: string;
	updatedAt: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
	attachments: LocalMediaAttachment[];
}

export interface MediaListItem {
	id: string;
	userId: string;
	url: string | null;
	localUri: string | null;
	mimeType: string;
	status: LocalMedia["status"];
	createdAt: string;
	updatedAt: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
	attachments: LocalMediaAttachment[];
	isLocalOnly: boolean;
}

function sortAttachments(attachments: LocalMediaAttachment[]) {
	return [...attachments].sort((a, b) => a.position - b.position);
}

export function mergeMediaRecords(params: {
	localMedia: LocalMedia[];
	localAttachments: LocalMediaAttachment[];
	serverMedia: ServerMediaRecord[];
}): MediaListItem[] {
	const { localMedia, localAttachments, serverMedia } = params;

	const localById = new Map(localMedia.map((item) => [item.id, item]));
	const serverById = new Map(serverMedia.map((item) => [item.id, item]));

	const attachmentsByMediaId = new Map<string, LocalMediaAttachment[]>();
	for (const attachment of localAttachments) {
		const list = attachmentsByMediaId.get(attachment.mediaId) ?? [];
		list.push(attachment);
		attachmentsByMediaId.set(attachment.mediaId, list);
	}

	const ids = [...new Set([...localById.keys(), ...serverById.keys()])];

	return ids
		.map((id) => {
			const localRecord = localById.get(id);
			const serverRecord = serverById.get(id);
			if (!localRecord && !serverRecord) return null;

			const attachments = serverRecord
				? sortAttachments(serverRecord.attachments)
				: sortAttachments(attachmentsByMediaId.get(id) ?? []);

			return {
				id,
				userId: localRecord?.userId ?? serverRecord?.userId ?? "",
				url: localRecord?.url ?? serverRecord?.url ?? null,
				localUri: localRecord?.localUri ?? null,
				mimeType: localRecord?.mimeType ?? serverRecord?.mimeType ?? "",
				status: localRecord?.status ?? (serverRecord ? "uploaded" : null),
				createdAt: localRecord?.createdAt ?? serverRecord?.createdAt ?? "",
				updatedAt: localRecord?.updatedAt ?? serverRecord?.updatedAt ?? "",
				scopeType:
					localRecord?.scopeType ?? serverRecord?.scopeType ?? "personal",
				scopeId: localRecord?.scopeId ?? serverRecord?.scopeId ?? "",
				organizationId:
					localRecord?.organizationId ?? serverRecord?.organizationId ?? "",
				createdBy: localRecord?.createdBy ?? serverRecord?.createdBy ?? "",
				attachments,
				isLocalOnly: !serverRecord,
			} satisfies MediaListItem;
		})
		.filter((item): item is MediaListItem => item !== null)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
