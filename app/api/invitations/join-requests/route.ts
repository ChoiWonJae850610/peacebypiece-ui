import { handleCreateJoinRequest, handleListJoinRequests } from "@/lib/invitations/api/joinRequestRouteHandlers";

export async function POST(request: Request) {
  return handleCreateJoinRequest(request);
}

export async function GET(request: Request) {
  return handleListJoinRequests(request);
}
