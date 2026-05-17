import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { handleApproveCompanyJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type SystemCompanyJoinRequestApproveRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: SystemCompanyJoinRequestApproveRouteContext) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  const { requestId } = await context.params;
  return handleApproveCompanyJoinRequest(requestId, request, { actorSystemUserId: scope.systemScope.userId });
}
