import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { handleRejectMemberJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

type MemberJoinRequestReviewRouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: MemberJoinRequestReviewRouteContext) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.memberReject,
  });
  if (!guard.ok) return guard.response;

  const { requestId } = await context.params;
  return handleRejectMemberJoinRequest(requestId, request);
}
