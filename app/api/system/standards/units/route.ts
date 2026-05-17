import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  handleGetSystemUnitStandards,
  handlePatchSystemUnitStandard,
  handlePostSystemUnitStandard,
} from "@/lib/system/standards/api/unitRouteHandlers";

export async function GET() {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleGetSystemUnitStandards();
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handlePostSystemUnitStandard(request, { actorUserId: scope.systemScope.userId });
}

export async function PATCH(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handlePatchSystemUnitStandard(request, { actorUserId: scope.systemScope.userId });
}
