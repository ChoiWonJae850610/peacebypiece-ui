import { handleRevokeInvitation } from "@/lib/invitations/api/invitationRouteHandlers";

type InvitationRevokeRouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function POST(_request: Request, context: InvitationRevokeRouteContext) {
  const { invitationId } = await context.params;
  return handleRevokeInvitation(invitationId);
}
