import { handleGetSystemAuditLogs } from "@/lib/system/audit/api/routeHandlers";

export async function GET(request: Request) {
  return handleGetSystemAuditLogs(request);
}
