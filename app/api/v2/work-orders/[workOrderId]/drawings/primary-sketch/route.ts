import { handleGetPrimaryWorkOrderDrawing, handleSavePrimaryWorkOrderDrawing } from "@/lib/domain/work-orders/drawing/drawingRoute";

type Context = { readonly params: Promise<{ readonly workOrderId: string }> };

export async function GET(request: Request, context: Context) {
  const { workOrderId } = await context.params;
  return handleGetPrimaryWorkOrderDrawing(request, workOrderId);
}

export async function PATCH(request: Request, context: Context) {
  const { workOrderId } = await context.params;
  return handleSavePrimaryWorkOrderDrawing(request, workOrderId);
}
