import { handleDeleteDraftWorkOrder } from "@/lib/domain/work-orders/command/draftDeleteRoute";
import { handlePatchWorkOrderBasicInfoV2 } from "@/lib/domain/work-orders/command/commandRoute";
import { handleGetWorkOrderDetailV2 } from "@/lib/domain/work-orders/read/detailRoute";

type Context = { readonly params: Promise<{ readonly workOrderId: string }> };

export async function GET(request: Request, context: Context) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderDetailV2(request, workOrderId);
}

export async function PATCH(request: Request, context: Context) {
  const { workOrderId } = await context.params;
  return handlePatchWorkOrderBasicInfoV2(request, workOrderId);
}

export async function DELETE(request: Request, context: Context) {
  const { workOrderId } = await context.params;
  return handleDeleteDraftWorkOrder(request, workOrderId);
}
