import { handleApproveCompanyJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type SystemCompanyJoinRequestApproveRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: SystemCompanyJoinRequestApproveRouteContext) {
  const { requestId } = await context.params;
  return handleApproveCompanyJoinRequest(requestId, request);
}
