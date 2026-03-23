import { z } from "zod";

export const createOrgSchema = z.object({
	name: z.string().min(1),
	slug: z.string(),
	logo: z.string(),
});

export const teamNameSchema = z.object({
	name: z.string().min(1),
});

export const addMemberSchema = z.object({
	email: z.string().email(),
});
