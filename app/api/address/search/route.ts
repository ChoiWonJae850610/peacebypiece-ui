import { NextResponse } from "next/server";

import { searchRoadNameAddresses } from "@/lib/address/jusoAddressSearch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "ADDRESS_SEARCH_FAILED";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  try {
    const items = await searchRoadNameAddresses(keyword ?? "");
    return NextResponse.json({ items });
  } catch (error) {
    const errorCode = getErrorCode(error);
    const status = errorCode === "ADDRESS_SEARCH_KEYWORD_REQUIRED" ? 400 : errorCode === "ADDRESS_SEARCH_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ items: [], error: errorCode }, { status });
  }
}
