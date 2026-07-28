import { handleCompleteWorkOrderAttachmentUpload } from "@/lib/domain/work-orders/command/attachmentCommandRoute";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleCompleteWorkOrderAttachmentUpload(request, workOrderId);
}
