import type { OrgDesignPreset } from "@pengana/org-client";
import { createContext, type ReactNode, useContext, useState } from "react";

type OrgDesignPresetPreviewContextValue = {
	previewDesignPreset: OrgDesignPreset | null;
	setPreviewDesignPreset: (preset: OrgDesignPreset | null) => void;
};

const OrgDesignPresetPreviewContext =
	createContext<OrgDesignPresetPreviewContextValue | null>(null);

export function OrgDesignPresetPreviewProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [previewDesignPreset, setPreviewDesignPreset] =
		useState<OrgDesignPreset | null>(null);

	return (
		<OrgDesignPresetPreviewContext.Provider
			value={{ previewDesignPreset, setPreviewDesignPreset }}
		>
			{children}
		</OrgDesignPresetPreviewContext.Provider>
	);
}

export function useOrgDesignPresetPreview() {
	const context = useContext(OrgDesignPresetPreviewContext);

	if (!context) {
		throw new Error(
			"useOrgDesignPresetPreview must be used within OrgDesignPresetPreviewProvider",
		);
	}

	return context;
}
