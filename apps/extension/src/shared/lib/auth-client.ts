import { createAuthClient, organizationClient } from "@pengana/auth/client";
import { env } from "@pengana/env/web";

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
