import { NextRequest } from "next/server";

import { handleIssueWorkOrderAttachmentPreview } from "@/lib/workorder/attachments/attachmentPreviewRoute";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ workOrderId: string; attachmentId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { workOrderId, attachmentId } = await context.params;
  return handleIssueWorkOrderAttachmentPreview(request, workOrderId, attachmentId);
}
