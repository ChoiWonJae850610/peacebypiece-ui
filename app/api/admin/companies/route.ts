import { NextResponse } from "next/server";
import { listAdminCompanies } from "@/lib/admin/settings/companyRepository";

export async function GET() {
  try {
    return NextResponse.json({ companies: await listAdminCompanies() });
  } catch {
    return NextResponse.json({ companies: [], error: "ADMIN_COMPANIES_LIST_UNAVAILABLE" }, { status: 200 });
  }
}
