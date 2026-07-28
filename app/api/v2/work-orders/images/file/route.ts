import { NextRequest } from "next/server";

import { handleWorkOrderAttachmentFileGet } from "@/lib/workorder/attachments/attachmentFileRoute";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return handleWorkOrderAttachmentFileGet(request);
}
