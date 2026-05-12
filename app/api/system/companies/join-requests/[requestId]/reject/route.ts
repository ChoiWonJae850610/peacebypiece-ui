import { handleRejectCompanyJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type SystemCompanyJoinRequestRejectRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: SystemCompanyJoinRequestRejectRouteContext) {
  const { requestId } = await context.params;
  return handleRejectCompanyJoinRequest(requestId, request);
}
