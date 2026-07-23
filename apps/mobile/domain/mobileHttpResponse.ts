import type { MobileApiErrorCode } from "./mobileContract.ts";

export type NonJsonHttpError = {
  readonly code: MobileApiErrorCode;
  readonly message: string;
};

export function classifyNonJsonHttpResponse(status: number): NonJsonHttpError {
  if (status >= 200 && status < 300) {
    return { code: "MALFORMED_RESPONSE", message: "서버 응답 형식이 올바르지 않습니다." };
  }
  if (status === 401) return { code: "AUTH_REQUIRED", message: "연결이 필요합니다." };
  if (status === 403) return { code: "FORBIDDEN", message: "현재 실행 환경에서는 이 변경을 저장할 수 없습니다." };
  if (status === 404) return { code: "NOT_FOUND", message: "요청한 정보를 찾을 수 없습니다." };
  if (status === 409) return { code: "CONFLICT", message: "다른 변경이 먼저 저장되었습니다." };
  if (status === 429) return { code: "RATE_LIMITED", message: "요청이 많습니다. 잠시 후 다시 시도하세요." };
  if (status >= 500) return { code: "INTERNAL_ERROR", message: "서버에서 요청을 처리하지 못했습니다." };
  return { code: "NETWORK_ERROR", message: "요청을 처리하지 못했습니다." };
}
