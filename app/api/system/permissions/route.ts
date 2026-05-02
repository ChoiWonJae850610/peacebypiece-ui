import { handleListPermissions } from "@/lib/permissions/api/permissionRouteHandlers";

export async function GET(request: Request) {
  return handleListPermissions(request);
}
