import "server-only";

import { createHash } from "crypto";

export type RoadNameAddressSearchItem = {
  zipNo: string;
  roadAddr: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  bdNm?: string;
};

export type JusoAddressSearchItem = {
  readonly id: string;
  readonly roadAddress: string;
  readonly jibunAddress: string;
  readonly postalCode: string;
  readonly buildingName: string;
};

export type JusoAddressSearchPage = {
  readonly items: readonly JusoAddressSearchItem[];
  readonly page: number;
  readonly totalCount: number;
  readonly hasMore: boolean;
};

export const ADDRESS_SEARCH_ERROR_CODES = {
  keywordRequired: "ADDRESS_SEARCH_KEYWORD_REQUIRED",
  keywordInvalid: "ADDRESS_SEARCH_KEYWORD_INVALID",
  notConfigured: "ADDRESS_SEARCH_NOT_CONFIGURED",
  upstreamFailed: "ADDRESS_SEARCH_UPSTREAM_FAILED",
  providerRejected: "ADDRESS_SEARCH_PROVIDER_REJECTED",
  responseInvalid: "ADDRESS_SEARCH_RESPONSE_INVALID",
  failed: "ADDRESS_SEARCH_FAILED",
} as const;

type AddressSearchErrorCode = (typeof ADDRESS_SEARCH_ERROR_CODES)[keyof typeof ADDRESS_SEARCH_ERROR_CODES];

export class RoadNameAddressSearchError extends Error {
  readonly code: AddressSearchErrorCode;

  constructor(code: AddressSearchErrorCode) {
    super(code);
    this.name = "RoadNameAddressSearchError";
    this.code = code;
  }
}

type JusoApiAddress = {
  zipNo?: string;
  roadAddr?: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  bdNm?: string;
  admCd?: string;
  rnMgtSn?: string;
  bdMgtSn?: string;
};

type JusoApiResponse = {
  results?: {
    common?: {
      errorCode?: string;
      totalCount?: string;
      currentPage?: string;
      countPerPage?: string;
    };
    juso?: JusoApiAddress[] | null;
  };
};

export const JUSO_ADDRESS_SEARCH_ENV = "JUSO_API_KEY";
export const JUSO_ADDRESS_SEARCH_PAGE_SIZE = 10;
export const JUSO_ADDRESS_SEARCH_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";
const JUSO_API_SUCCESS_CODE = "0";
const JUSO_TIMEOUT_MS = 6_000;
const JUSO_MAX_RESPONSE_BYTES = 512 * 1024;
const JUSO_MAX_PAGE = 900;
const JUSO_MAX_KEYWORD_CODEPOINTS = 80;
const JUSO_FORBIDDEN_SPECIAL = /[%=><\[\]]/u;
const JUSO_FORBIDDEN_SQL_WORD = /\b(?:OR|SELECT|INSERT|DELETE|UPDATE|CREATE|DROP|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b/iu;

function normalizeProviderText(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFC").trim();
}

export function normalizeJusoKeyword(keyword: string | null | undefined): string {
  const normalized = normalizeProviderText(keyword).replace(/\s+/gu, " ");
  if (Array.from(normalized).length < 2) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.keywordRequired);
  if (
    Array.from(normalized).length > JUSO_MAX_KEYWORD_CODEPOINTS
    || JUSO_FORBIDDEN_SPECIAL.test(normalized)
    || JUSO_FORBIDDEN_SQL_WORD.test(normalized)
    || /[\u0000-\u001f\u007f]/u.test(normalized)
  ) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.keywordInvalid);
  return normalized;
}

export function normalizeJusoPage(value: number | string | null | undefined): number {
  const page = typeof value === "number" ? value : Number.parseInt(String(value ?? "1"), 10);
  if (!Number.isSafeInteger(page) || page < 1 || page > JUSO_MAX_PAGE) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.keywordInvalid);
  }
  return page;
}

function normalizeAddressItem(item: JusoApiAddress): JusoAddressSearchItem | null {
  const postalCode = normalizeProviderText(item.zipNo);
  const roadAddress = normalizeProviderText(item.roadAddr) || normalizeProviderText(item.roadAddrPart1);
  const jibunAddress = normalizeProviderText(item.jibunAddr);
  const buildingName = normalizeProviderText(item.bdNm);
  if (!postalCode || !roadAddress) return null;
  const identity = [item.admCd, item.rnMgtSn, item.bdMgtSn, postalCode, roadAddress].map(normalizeProviderText);
  return {
    id: createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 24),
    roadAddress,
    jibunAddress,
    postalCode,
    buildingName,
  };
}

function toLegacyAddressItem(item: JusoApiAddress): RoadNameAddressSearchItem | null {
  const zipNo = normalizeProviderText(item.zipNo);
  const roadAddr = normalizeProviderText(item.roadAddr);
  const roadAddrPart1 = normalizeProviderText(item.roadAddrPart1);
  if (!zipNo || (!roadAddr && !roadAddrPart1)) return null;
  return {
    zipNo,
    roadAddr,
    roadAddrPart1: roadAddrPart1 || undefined,
    roadAddrPart2: normalizeProviderText(item.roadAddrPart2) || undefined,
    jibunAddr: normalizeProviderText(item.jibunAddr) || undefined,
    bdNm: normalizeProviderText(item.bdNm) || undefined,
  };
}

async function requestJuso(keyword: string, page: number): Promise<{ readonly payload: JusoApiResponse; readonly addresses: readonly JusoApiAddress[] }> {
  const confirmationKey = process.env[JUSO_ADDRESS_SEARCH_ENV]?.trim();
  if (!confirmationKey) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.notConfigured);
  const requestUrl = new URL(JUSO_ADDRESS_SEARCH_ENDPOINT);
  requestUrl.searchParams.set("confmKey", confirmationKey);
  requestUrl.searchParams.set("currentPage", String(page));
  requestUrl.searchParams.set("countPerPage", String(JUSO_ADDRESS_SEARCH_PAGE_SIZE));
  requestUrl.searchParams.set("keyword", keyword);
  requestUrl.searchParams.set("resultType", "json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JUSO_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(requestUrl, { method: "GET", cache: "no-store", signal: controller.signal });
  } catch {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.upstreamFailed);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.upstreamFailed);
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > JUSO_MAX_RESPONSE_BYTES) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.responseInvalid);
  const body = await response.arrayBuffer();
  if (body.byteLength > JUSO_MAX_RESPONSE_BYTES) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.responseInvalid);
  let payload: JusoApiResponse;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)) as JusoApiResponse;
  } catch {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.responseInvalid);
  }
  const common = payload.results?.common;
  if (!common) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.responseInvalid);
  if (normalizeProviderText(common.errorCode) !== JUSO_API_SUCCESS_CODE) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.providerRejected);
  }
  return { payload, addresses: Array.isArray(payload.results?.juso) ? payload.results.juso : [] };
}

export function isRoadNameAddressSearchError(error: unknown): error is RoadNameAddressSearchError {
  return error instanceof RoadNameAddressSearchError;
}

export async function searchJusoAddresses(input: { readonly keyword: string; readonly page?: number | string | null }): Promise<JusoAddressSearchPage> {
  const keyword = normalizeJusoKeyword(input.keyword);
  const page = normalizeJusoPage(input.page);
  const { payload, addresses } = await requestJuso(keyword, page);
  const totalCount = Number.parseInt(normalizeProviderText(payload.results?.common?.totalCount), 10);
  if (!Number.isSafeInteger(totalCount) || totalCount < 0) throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.responseInvalid);
  return {
    items: addresses.map(normalizeAddressItem).filter((item): item is JusoAddressSearchItem => item !== null),
    page,
    totalCount,
    hasMore: page * JUSO_ADDRESS_SEARCH_PAGE_SIZE < totalCount,
  };
}

export async function searchRoadNameAddresses(keyword: string): Promise<RoadNameAddressSearchItem[]> {
  const normalized = normalizeJusoKeyword(keyword);
  const { addresses } = await requestJuso(normalized, 1);
  return addresses.map(toLegacyAddressItem).filter((item): item is RoadNameAddressSearchItem => item !== null);
}
