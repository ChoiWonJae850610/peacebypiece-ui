import { handleSetWorkOrderAttachmentOutputInclude } from "@/lib/domain/work-orders/command/attachmentCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string; attachmentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workOrderId, attachmentId } = await context.params;
  return handleSetWorkOrderAttachmentOutputInclude(request, workOrderId, attachmentId);
}
