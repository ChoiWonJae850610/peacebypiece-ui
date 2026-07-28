import { handleDeleteWorkOrderAttachment } from "@/lib/domain/work-orders/command/attachmentCommandRoute";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ workOrderId: string; attachmentId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId, attachmentId } = await context.params;
  return handleDeleteWorkOrderAttachment(request, workOrderId, attachmentId);
}
