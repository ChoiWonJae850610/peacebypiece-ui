import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  handleGetSystemProcessStandards,
  handlePatchSystemProcessStandard,
  handlePostSystemProcessStandard,
} from "@/lib/system/standards/api/processRouteHandlers";

export async function GET() {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleGetSystemProcessStandards();
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handlePostSystemProcessStandard(request, { actorUserId: scope.systemScope.userId });
}

export async function PATCH(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handlePatchSystemProcessStandard(request, { actorUserId: scope.systemScope.userId });
}
