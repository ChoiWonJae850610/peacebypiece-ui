export type RoadNameAddressSearchItem = {
  zipNo: string;
  roadAddr: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  bdNm?: string;
};

export const ADDRESS_SEARCH_ERROR_CODES = {
  keywordRequired: "ADDRESS_SEARCH_KEYWORD_REQUIRED",
  notConfigured: "ADDRESS_SEARCH_NOT_CONFIGURED",
  upstreamFailed: "ADDRESS_SEARCH_UPSTREAM_FAILED",
  providerRejected: "ADDRESS_SEARCH_PROVIDER_REJECTED",
  responseInvalid: "ADDRESS_SEARCH_RESPONSE_INVALID",
  failed: "ADDRESS_SEARCH_FAILED",
} as const;

type AddressSearchErrorCode = (typeof ADDRESS_SEARCH_ERROR_CODES)[keyof typeof ADDRESS_SEARCH_ERROR_CODES];

export class RoadNameAddressSearchError extends Error {
  readonly code: AddressSearchErrorCode;
  readonly providerCode?: string;
  readonly providerMessage?: string;

  constructor(code: AddressSearchErrorCode, options?: { providerCode?: string; providerMessage?: string }) {
    super(code);
    this.name = "RoadNameAddressSearchError";
    this.code = code;
    this.providerCode = options?.providerCode;
    this.providerMessage = options?.providerMessage;
  }
}

type JusoApiAddress = {
  zipNo?: string;
  roadAddr?: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  bdNm?: string;
};

type JusoApiResponse = {
  results?: {
    common?: {
      errorCode?: string;
      errorMessage?: string;
      totalCount?: string;
    };
    juso?: JusoApiAddress[] | null;
  };
};

const JUSO_ADDRESS_SEARCH_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";
const DEFAULT_ADDRESS_SEARCH_PAGE = "1";
const DEFAULT_ADDRESS_SEARCH_COUNT = "10";
const JUSO_API_SUCCESS_CODE = "0";

function normalizeKeyword(keyword: string | null | undefined): string {
  return String(keyword ?? "").trim();
}

function normalizeProviderText(value: string | null | undefined): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function normalizeAddressItem(item: JusoApiAddress): RoadNameAddressSearchItem | null {
  const zipNo = String(item.zipNo ?? "").trim();
  const roadAddr = String(item.roadAddr ?? "").trim();
  const roadAddrPart1 = String(item.roadAddrPart1 ?? "").trim();
  const roadAddrPart2 = String(item.roadAddrPart2 ?? "").trim();
  const jibunAddr = String(item.jibunAddr ?? "").trim();
  const bdNm = String(item.bdNm ?? "").trim();

  if (!zipNo || (!roadAddr && !roadAddrPart1)) return null;

  return {
    zipNo,
    roadAddr,
    roadAddrPart1: roadAddrPart1 || undefined,
    roadAddrPart2: roadAddrPart2 || undefined,
    jibunAddr: jibunAddr || undefined,
    bdNm: bdNm || undefined,
  };
}

export function isRoadNameAddressSearchError(error: unknown): error is RoadNameAddressSearchError {
  return error instanceof RoadNameAddressSearchError;
}

export async function searchRoadNameAddresses(keyword: string): Promise<RoadNameAddressSearchItem[]> {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.keywordRequired);
  }

  const confirmationKey = process.env.JUSO_API_KEY?.trim();
  if (!confirmationKey) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.notConfigured);
  }

  const requestUrl = new URL(JUSO_ADDRESS_SEARCH_ENDPOINT);
  requestUrl.searchParams.set("confmKey", confirmationKey);
  requestUrl.searchParams.set("currentPage", DEFAULT_ADDRESS_SEARCH_PAGE);
  requestUrl.searchParams.set("countPerPage", DEFAULT_ADDRESS_SEARCH_COUNT);
  requestUrl.searchParams.set("keyword", normalizedKeyword);
  requestUrl.searchParams.set("resultType", "json");

  const response = await fetch(requestUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.upstreamFailed);
  }

  const payload = (await response.json()) as JusoApiResponse;
  const common = payload.results?.common;
  if (!common) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.responseInvalid);
  }

  if (common.errorCode && common.errorCode !== JUSO_API_SUCCESS_CODE) {
    throw new RoadNameAddressSearchError(ADDRESS_SEARCH_ERROR_CODES.providerRejected, {
      providerCode: normalizeProviderText(common.errorCode),
      providerMessage: normalizeProviderText(common.errorMessage),
    });
  }

  return (payload.results?.juso ?? [])
    .map(normalizeAddressItem)
    .filter((item): item is RoadNameAddressSearchItem => item !== null);
}
