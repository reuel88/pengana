import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
	baseURL: getServerUrl(),
	fetchOptions:
		Platform.OS === "web" ? { credentials: "include" as const } : undefined,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
		}),
	],
});
