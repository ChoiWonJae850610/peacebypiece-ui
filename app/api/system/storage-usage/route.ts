import {
  handleCreateStorageUsageSnapshot,
  handleGetStorageUsage,
} from "@/lib/billing/api/storageUsageRouteHandlers";

export async function GET(request: Request) {
  return handleGetStorageUsage(request);
}

export async function POST(request: Request) {
  return handleCreateStorageUsageSnapshot(request);
}
