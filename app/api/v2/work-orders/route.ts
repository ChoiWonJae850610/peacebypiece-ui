import { handleCreateWorkOrderDraftV2 } from "@/lib/domain/work-orders/command/commandRoute";
import { handleGetWorkOrdersV2 } from "@/lib/domain/work-orders/read/listRoute";

export async function GET(request: Request) {
  return handleGetWorkOrdersV2(request);
}

export async function POST(request: Request) {
  return handleCreateWorkOrderDraftV2(request);
}
