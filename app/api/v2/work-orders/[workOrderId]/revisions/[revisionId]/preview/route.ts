import { handleGetIssuedWorkOrderPreview } from "@/lib/domain/work-orders/read/previewRoute";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ workOrderId: string; revisionId: string }> }) {
  const { workOrderId, revisionId } = await context.params;
  return handleGetIssuedWorkOrderPreview(request, workOrderId, revisionId);
}
