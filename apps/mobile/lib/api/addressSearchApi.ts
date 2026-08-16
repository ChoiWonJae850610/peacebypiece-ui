import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject } from "../apiResponseNormalizer";
import { requestJson } from "../apiTransport";

export type AddressSearchItem = {
  readonly id: string;
  readonly roadAddress: string;
  readonly jibunAddress: string;
  readonly postalCode: string;
  readonly buildingName: string;
};

export type AddressSearchPage = {
  readonly items: readonly AddressSearchItem[];
  readonly page: number;
  readonly totalCount: number;
  readonly hasMore: boolean;
};

function normalizeItem(value: unknown): AddressSearchItem | null {
  if (!isJsonObject(value)) return null;
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const roadAddress = typeof value.roadAddress === "string" ? value.roadAddress.normalize("NFC").trim() : "";
  const jibunAddress = typeof value.jibunAddress === "string" ? value.jibunAddress.normalize("NFC").trim() : "";
  const postalCode = typeof value.postalCode === "string" ? value.postalCode.trim() : "";
  const buildingName = typeof value.buildingName === "string" ? value.buildingName.normalize("NFC").trim() : "";
  if (!/^[0-9a-f]{24}$/u.test(id) || !roadAddress || !/^\d{5}$/u.test(postalCode)) return null;
  return { id, roadAddress, jibunAddress, postalCode, buildingName };
}

export async function searchAddresses(keyword: string, page = 1): Promise<AddressSearchPage> {
  const query = new URLSearchParams({ keyword: keyword.normalize("NFC").trim(), page: String(page) });
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/address-search?${query.toString()}`,
    { method: "GET" },
  );
  if (!body.ok || !isJsonObject(body.data) || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "주소 검색 응답을 확인할 수 없습니다." });
  }
  const items = body.data.items.map(normalizeItem);
  if (items.some((item) => item === null)
    || !Number.isSafeInteger(body.data.page) || Number(body.data.page) < 1
    || !Number.isSafeInteger(body.data.totalCount) || Number(body.data.totalCount) < 0
    || typeof body.data.hasMore !== "boolean") {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "주소 검색 응답을 확인할 수 없습니다." });
  }
  return {
    items: items as AddressSearchItem[],
    page: Number(body.data.page),
    totalCount: Number(body.data.totalCount),
    hasMore: body.data.hasMore,
  };
}
