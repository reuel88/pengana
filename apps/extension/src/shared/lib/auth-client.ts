import { env } from "@pengana/env/web";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const orgDesignPresetField = {
	type: "json",
	required: false,
	input: true,
} as const;

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	plugins: [
		organizationClient({
			teams: { enabled: true },
			schema: {
				organization: {
					additionalFields: {
						designPreset: orgDesignPresetField,
					},
				},
			},
		}),
	],
	sessionOptions: {
		refetchOnWindowFocus: false,
	},
});
