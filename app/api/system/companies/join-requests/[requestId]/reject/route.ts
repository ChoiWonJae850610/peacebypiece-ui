import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { handleRejectCompanyJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type SystemCompanyJoinRequestRejectRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: SystemCompanyJoinRequestRejectRouteContext) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  const { requestId } = await context.params;
  return handleRejectCompanyJoinRequest(requestId, request, { actorSystemUserId: scope.systemScope.userId });
}
