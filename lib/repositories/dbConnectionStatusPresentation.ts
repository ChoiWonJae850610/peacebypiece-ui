import type { DbConnectionStatus } from "@/lib/repositories/dbConnectionStatusStore";

export type DbConnectionStatusPresentation = {
  label: string;
  toneClass: string;
  title: string | null;
};

function formatCheckedAt(checkedAt: string | null): string | null {
  if (!checkedAt) return null;
  const parsed = new Date(checkedAt);
  if (Number.isNaN(parsed.getTime())) return checkedAt;
  return parsed.toLocaleString("ko-KR", { hour12: false });
}

export function getDbConnectionStatusPresentation(
  status?: DbConnectionStatus,
): DbConnectionStatusPresentation | null {
  if (!status) return null;

  const checkedAt = formatCheckedAt(status.checkedAt);
  const baseTitle = [
    status.message,
    status.configSource ? `환경 키: ${status.configSource}` : null,
    checkedAt ? `확인 시각: ${checkedAt}` : null,
  ].filter(Boolean).join("\n") || null;

  if (status.connected) {
    const label =
      status.source === "create"
        ? "DB 생성 성공"
        : status.source === "save"
          ? "DB 저장 성공"
          : status.source === "delete"
            ? "DB 삭제 성공"
            : "DB 연결";

    return {
      label,
      toneClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      title: baseTitle,
    };
  }

  const errorLabels: Record<string, string> = {
    DB_NOT_CONFIGURED: "DB ENV 미설정",
    DB_DRIVER_MISSING: "DB 드라이버 없음",
    DB_CONNECTION_FAILED: "DB 연결 실패",
    DB_TABLE_MISSING: "spec_sheets 테이블 없음",
    DB_SCHEMA_INVALID: "spec_sheets 스키마 오류",
    DB_SCHEMA_UNSUPPORTED: "spec_sheets 스키마 미지원",
    DB_RESPONSE_PARSE_FAILED: "DB 응답 파싱 실패",
    DB_EMPTY_RESPONSE: "DB 빈 응답",
    DB_REQUEST_FAILED: "DB 요청 실패",
    DB_UNKNOWN_ERROR: "DB 알 수 없는 오류",
    UNKNOWN: "DB 미확인",
  };

  return {
    label: errorLabels[status.code] ?? (status.fallbackActive ? "LOCAL FALLBACK" : "DB 미확인"),
    toneClass: "border-amber-200 bg-amber-50 text-amber-700",
    title: baseTitle,
  };
}
