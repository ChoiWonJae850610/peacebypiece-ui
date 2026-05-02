import {
  handleCreateCompany,
  handleListCompanies,
} from "@/lib/company/api/companyRouteHandlers";

export async function GET(request: Request) {
  return handleListCompanies(request);
}

export async function POST(request: Request) {
  return handleCreateCompany(request);
}
