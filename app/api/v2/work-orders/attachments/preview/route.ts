import { NextRequest } from "next/server";

import { handleOpenWorkOrderAttachmentPreview } from "@/lib/workorder/attachments/attachmentPreviewRoute";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return handleOpenWorkOrderAttachmentPreview(request);
}
