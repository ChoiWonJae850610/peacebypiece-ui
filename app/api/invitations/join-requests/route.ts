import { handleCreateJoinRequest } from "@/lib/invitations/api/joinRequestRouteHandlers";

export async function POST(request: Request) {
  return handleCreateJoinRequest(request);
}
