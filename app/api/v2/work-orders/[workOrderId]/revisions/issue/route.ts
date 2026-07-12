import { handleIssueWorkOrderRevisionV2 } from "@/lib/domain/work-orders/command/issueRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleIssueWorkOrderRevisionV2(request, workOrderId);
}
