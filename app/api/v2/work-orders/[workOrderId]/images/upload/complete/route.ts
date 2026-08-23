import { handleCompleteWorkOrderImageUpload, handleReconcileWorkOrderImageUpload } from "@/lib/domain/work-orders/command/imageCommandRoute";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleCompleteWorkOrderImageUpload(request, workOrderId);
}

export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleReconcileWorkOrderImageUpload(request, workOrderId);
}
