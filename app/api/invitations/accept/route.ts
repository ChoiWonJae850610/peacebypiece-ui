import {
  handleAcceptInvitation,
  handlePreviewInvitationAcceptance,
} from "@/lib/invitations/api/invitationAcceptanceRouteHandlers";

export async function GET(request: Request) {
  return handlePreviewInvitationAcceptance(request);
}

export async function POST(request: Request) {
  return handleAcceptInvitation(request);
}
