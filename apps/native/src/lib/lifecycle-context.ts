import type { UserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";
import { createContext, useContext } from "react";

export const LifecycleContext = createContext<UserLifecycleData | null>(null);

export function useLifecycleData() {
	return useContext(LifecycleContext);
}
