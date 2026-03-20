export interface MediaConfig {
	scopeType: "personal" | "org";
}

export const personalMediaConfig: MediaConfig = {
	scopeType: "personal",
};

export const orgMediaConfig: MediaConfig = {
	scopeType: "org",
};
