import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { handleGetSystemAuditLogs } from "@/lib/system/audit/api/routeHandlers";

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleGetSystemAuditLogs(request);
}
