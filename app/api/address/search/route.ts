import { NextResponse } from "next/server";

import {
  ADDRESS_SEARCH_ERROR_CODES,
  isRoadNameAddressSearchError,
  searchRoadNameAddresses,
} from "@/lib/address/jusoAddressSearch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AddressSearchErrorResponse = {
  items: [];
  error: string;
};

const ADDRESS_SEARCH_ERROR_STATUS: Record<string, number> = {
  [ADDRESS_SEARCH_ERROR_CODES.keywordRequired]: 400,
  [ADDRESS_SEARCH_ERROR_CODES.keywordInvalid]: 400,
  [ADDRESS_SEARCH_ERROR_CODES.notConfigured]: 503,
  [ADDRESS_SEARCH_ERROR_CODES.providerRejected]: 502,
  [ADDRESS_SEARCH_ERROR_CODES.upstreamFailed]: 502,
  [ADDRESS_SEARCH_ERROR_CODES.responseInvalid]: 502,
  [ADDRESS_SEARCH_ERROR_CODES.failed]: 502,
};

function getErrorCode(error: unknown): string {
  if (isRoadNameAddressSearchError(error)) return error.code;
  return error instanceof Error ? error.message : ADDRESS_SEARCH_ERROR_CODES.failed;
}

function buildErrorResponse(error: unknown): AddressSearchErrorResponse {
  const errorCode = getErrorCode(error);
  return { items: [], error: errorCode };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  try {
    const items = await searchRoadNameAddresses(keyword ?? "");
    return NextResponse.json({ items });
  } catch (error) {
    const payload = buildErrorResponse(error);
    const status = ADDRESS_SEARCH_ERROR_STATUS[payload.error] ?? ADDRESS_SEARCH_ERROR_STATUS[ADDRESS_SEARCH_ERROR_CODES.failed];
    return NextResponse.json(payload, { status });
  }
}
