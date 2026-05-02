import {
  handleCreateInvitation,
  handleListInvitations,
} from "@/lib/invitations/api/invitationRouteHandlers";

export async function GET(request: Request) {
  return handleListInvitations(request);
}

export async function POST(request: Request) {
  return handleCreateInvitation(request);
}
