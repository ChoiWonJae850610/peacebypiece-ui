import { handleGetWorkOrdersV2 } from "@/lib/domain/work-orders/read/listRoute";

export async function GET(request: Request) {
  return handleGetWorkOrdersV2(request);
}
