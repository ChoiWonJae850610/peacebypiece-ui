import { handleVerifyInvitation } from "@/lib/invitations/api/joinRequestRouteHandlers";

export async function GET(request: Request) {
  return handleVerifyInvitation(request);
}
