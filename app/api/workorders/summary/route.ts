import { handleGetWorkOrderSummaries } from "@/lib/workorder/api/workOrderRouteHandlers";

export async function GET() {
  return handleGetWorkOrderSummaries();
}
