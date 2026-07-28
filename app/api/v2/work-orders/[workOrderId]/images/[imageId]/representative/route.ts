import { handleSetRepresentativeWorkOrderImage } from "@/lib/domain/work-orders/command/imageCommandRoute";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ workOrderId: string; imageId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId, imageId } = await context.params;
  return handleSetRepresentativeWorkOrderImage(request, workOrderId, imageId);
}
