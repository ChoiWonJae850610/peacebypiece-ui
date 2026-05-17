import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  handleCreateCompany,
  handleListCompanies,
} from "@/lib/company/api/companyRouteHandlers";

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleListCompanies(request);
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  return handleCreateCompany(request, { actorUserId: scope.systemScope.userId });
}
