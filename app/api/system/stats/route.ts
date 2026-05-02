import { handleGetSystemStats } from "@/lib/stats/api/statsRouteHandlers";

export async function GET(request: Request) {
  return handleGetSystemStats(request);
}
