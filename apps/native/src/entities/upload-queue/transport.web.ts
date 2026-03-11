import { createMemoryUploadTransport } from "@pengana/todo-client";

import { client } from "@/shared/api/orpc";

export const createWebUploadTransport = () =>
	createMemoryUploadTransport(client.upload);
