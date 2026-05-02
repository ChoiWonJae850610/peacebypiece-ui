import { handleGetAdminStats } from "@/lib/stats/api/statsRouteHandlers";

export async function GET(request: Request) {
  return handleGetAdminStats(request);
}
