import { NextResponse } from "next/server";

import { listSystemCatalog } from "@/lib/catalog/systemCatalogRepository";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";

export async function GET() {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    return NextResponse.json({ ok: true, catalog: await listSystemCatalog() });
  } catch {
    return NextResponse.json({ ok: false, error: "SYSTEM_CATALOG_UNAVAILABLE" }, { status: 500 });
  }
}
