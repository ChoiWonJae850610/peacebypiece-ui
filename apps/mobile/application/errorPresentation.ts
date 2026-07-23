import { MobileApiError } from "../domain/mobileContract.ts";

export type ErrorRetryTarget = "boot" | "list" | "detail" | "disconnect";

export type MobileErrorState = {
  readonly message: string;
  readonly guidance: string;
  readonly correlationId: string | null;
  readonly retryTarget: ErrorRetryTarget;
};

export function materialErrorMessage(error: unknown): string {
  if (!(error instanceof MobileApiError)) return "원단 정보를 불러오지 못했습니다";
  if (error.code === "FORBIDDEN" || error.status === 403) return "원단 정보를 볼 권한이 없습니다";
  if (error.code === "NOT_FOUND" || error.status === 404) return "작업지시서 또는 원단 정보를 찾을 수 없습니다";
  if (error.code === "CONFLICT" || error.status === 409) return "원단 정보를 최신 상태로 불러오지 못했습니다";
  return "원단 정보를 불러오지 못했습니다";
}

export function customerMessage(error: unknown): string {
  if (!(error instanceof MobileApiError)) return "요청을 처리하지 못했습니다.";
  if (error.code === "AUTH_REQUIRED" || error.status === 401) return "연결이 필요합니다.";
  if (error.code === "FORBIDDEN" || error.status === 403) return "작업지시서를 볼 권한이 없습니다.";
  if (error.code === "NOT_FOUND" || error.status === 404) return "작업지시서를 찾을 수 없습니다.";
  if (error.code === "MOBILE_CONNECT_CODE_UNAVAILABLE") return "연결 코드가 만료되었거나 사용할 수 없습니다.";
  if (error.code === "API_ORIGIN_INVALID") return error.message;
  if (error.code === "TIMEOUT") return "요청 시간이 초과되었습니다. 연결 상태를 확인한 뒤 다시 시도하세요.";
  if (error.code === "NETWORK_ERROR") return "연결 상태를 확인한 뒤 다시 시도하세요.";
  return "작업지시서를 불러오지 못했습니다.";
}

export function customerGuidance(error: unknown, retryTarget: ErrorRetryTarget): string {
  if (retryTarget === "detail" && error instanceof MobileApiError && (error.code === "NOT_FOUND" || error.status === 404)) {
    return "목록으로 돌아가 다른 작업지시서를 선택하세요.";
  }
  if (retryTarget === "detail" && error instanceof MobileApiError && (error.code === "FORBIDDEN" || error.status === 403)) {
    return "목록으로 돌아가 볼 수 있는 작업지시서를 선택하세요.";
  }
  if (error instanceof MobileApiError && (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT" || error.status >= 500)) {
    return "연결 상태를 확인한 뒤 직접 다시 시도하세요.";
  }
  return "자동으로 다시 요청하지 않습니다.";
}
