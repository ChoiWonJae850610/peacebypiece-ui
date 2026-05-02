import { handleGetSystemBillingOverview } from "@/lib/billing/api/systemBillingRouteHandlers";

export async function GET() {
  return handleGetSystemBillingOverview();
}
