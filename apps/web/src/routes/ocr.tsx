import { createFileRoute } from "@tanstack/react-router";

import { OcrPage } from "@/features/ocr/ocr-page";
import { requireAuthAndOrg } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/ocr")({
	component: OcrRoute,
	beforeLoad: requireAuthAndOrg,
});

function OcrRoute() {
	return <OcrPage />;
}
