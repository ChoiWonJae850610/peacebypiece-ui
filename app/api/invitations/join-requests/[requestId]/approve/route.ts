import { requireApiPermission } from "@/lib/permissions";
import { handleApproveMemberJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type MemberJoinRequestReviewRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: MemberJoinRequestReviewRouteContext) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "member.approve",
    routeLabel: "invitations.joinRequests.member.approve",
  });
  if (permissionDenied) return permissionDenied;

  const { requestId } = await context.params;
  return handleApproveMemberJoinRequest(requestId, request);
}
