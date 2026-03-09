import { createMemoryUploadTransport } from "@pengana/todo-client";

import { client } from "@/utils/orpc";

export const createWebUploadTransport = () =>
	createMemoryUploadTransport(client.upload);
