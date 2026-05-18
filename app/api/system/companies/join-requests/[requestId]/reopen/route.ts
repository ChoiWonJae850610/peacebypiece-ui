import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { handleReopenCompanyJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type SystemCompanyJoinRequestReopenRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: SystemCompanyJoinRequestReopenRouteContext) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  const { requestId } = await context.params;
  return handleReopenCompanyJoinRequest(requestId, request, { actorSystemUserId: scope.systemScope.userId });
}
