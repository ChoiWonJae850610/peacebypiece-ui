import { requireApiPermission } from "@/lib/permissions";
import { handleRejectMemberJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type MemberJoinRequestReviewRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: MemberJoinRequestReviewRouteContext) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "member.reject",
    routeLabel: "invitations.joinRequests.member.reject",
  });
  if (permissionDenied) return permissionDenied;

  const { requestId } = await context.params;
  return handleRejectMemberJoinRequest(requestId, request);
}
