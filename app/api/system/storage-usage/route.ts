import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  handleCreateStorageUsageSnapshot,
  handleGetStorageUsage,
} from "@/lib/billing/api/storageUsageRouteHandlers";

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleGetStorageUsage(request);
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleCreateStorageUsageSnapshot(request);
}
