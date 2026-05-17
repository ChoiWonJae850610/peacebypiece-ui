import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  handleGetSystemProductTemplates,
  handlePatchSystemProductTemplate,
  handlePostSystemProductTemplate,
} from "@/lib/system/standards/api/productTemplateRouteHandlers";

export async function GET() {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleGetSystemProductTemplates();
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handlePostSystemProductTemplate(request, { actorUserId: scope.systemScope.userId });
}

export async function PATCH(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handlePatchSystemProductTemplate(request, { actorUserId: scope.systemScope.userId });
}
