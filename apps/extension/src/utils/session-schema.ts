import { z } from "zod";

export const sessionResponseSchema = z.object({
	session: z.object({ userId: z.string() }).optional(),
	user: z.object({ id: z.string() }).optional(),
});
