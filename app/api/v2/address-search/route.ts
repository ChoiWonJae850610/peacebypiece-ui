import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  ADDRESS_SEARCH_ERROR_CODES,
  isRoadNameAddressSearchError,
  searchJusoAddresses,
} from "@/lib/address/jusoAddressSearch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ERROR_STATUS: Record<string, number> = {
  [ADDRESS_SEARCH_ERROR_CODES.keywordRequired]: 400,
  [ADDRESS_SEARCH_ERROR_CODES.keywordInvalid]: 400,
  [ADDRESS_SEARCH_ERROR_CODES.notConfigured]: 503,
  [ADDRESS_SEARCH_ERROR_CODES.providerRejected]: 502,
  [ADDRESS_SEARCH_ERROR_CODES.upstreamFailed]: 502,
  [ADDRESS_SEARCH_ERROR_CODES.responseInvalid]: 502,
  [ADDRESS_SEARCH_ERROR_CODES.failed]: 502,
};

const ERROR_MESSAGE: Record<string, string> = {
  [ADDRESS_SEARCH_ERROR_CODES.keywordRequired]: "검색어를 두 글자 이상 입력해 주세요.",
  [ADDRESS_SEARCH_ERROR_CODES.keywordInvalid]: "검색어를 확인해 주세요.",
  [ADDRESS_SEARCH_ERROR_CODES.notConfigured]: "주소 검색을 사용할 수 없습니다. 직접 입력해주세요.",
  [ADDRESS_SEARCH_ERROR_CODES.providerRejected]: "주소 검색에 실패했습니다. 다시 시도해주세요.",
  [ADDRESS_SEARCH_ERROR_CODES.upstreamFailed]: "주소 검색에 실패했습니다. 다시 시도해주세요.",
  [ADDRESS_SEARCH_ERROR_CODES.responseInvalid]: "주소 검색에 실패했습니다. 다시 시도해주세요.",
  [ADDRESS_SEARCH_ERROR_CODES.failed]: "주소 검색에 실패했습니다. 다시 시도해주세요.",
};

export async function GET(request: Request) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return guard.response;
  const searchParams = new URL(request.url).searchParams;
  try {
    const data = await searchJusoAddresses({ keyword: searchParams.get("keyword") ?? "", page: searchParams.get("page") });
    return createWaflApiSuccess(data, {
      headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId },
    });
  } catch (error) {
    const code = isRoadNameAddressSearchError(error) ? error.code : ADDRESS_SEARCH_ERROR_CODES.failed;
    return NextResponse.json({
      ok: false,
      error: { code, message: ERROR_MESSAGE[code] ?? ERROR_MESSAGE[ADDRESS_SEARCH_ERROR_CODES.failed], retryable: ERROR_STATUS[code] >= 500, correlationId },
    }, { status: ERROR_STATUS[code] ?? 502, headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  }
}
