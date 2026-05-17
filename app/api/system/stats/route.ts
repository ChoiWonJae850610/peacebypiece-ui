import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { handleGetSystemStats } from "@/lib/stats/api/statsRouteHandlers";

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleGetSystemStats(request);
}
