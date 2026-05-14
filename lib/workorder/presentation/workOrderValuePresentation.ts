import type { Locale } from "@/lib/i18n";


const KO_VALUE_LABELS: Record<string, string> = {
  yd: "야드",
  yard: "야드",
  yards: "야드",
  ea: "개",
  each: "개",
  pc: "개",
  pcs: "개",
  piece: "개",
  pieces: "개",
};

const EN_VALUE_LABELS: Record<string, string> = {
  "작성중": "Draft",
  "검토요청": "Review requested",
  "검토 요청": "Request review",
  "검토완료": "Review completed",
  "검토 완료": "Approve review",
  "발주요청": "Order requested",
  "발주 요청": "Request order",
  "발주대기": "Order pending",
  "검수": "Inspection",
  "검수대기": "Inspection pending",
  "검수중": "Inspection in progress",
  "검수완료": "Inspection completed",
  "검수 완료": "Complete inspection",
  "완료": "Completed",
  "반려": "Rejected",
  "요청 취소": "Cancel request",
  "취소": "Cancel",
  "재검수 요청": "Request reinspection",
  "메인 생산": "Main production",
  "샘플": "Sample",
  "재작업": "Rework",
  "선택 안함": "Not selected",
  "미지정": "Not set",
  "새 자재": "New material",
  "원단": "Fabric",
  "부자재": "Subsidiary",
  "기타": "Other",
  "재단": "Cutting",
  "봉제": "Sewing",
  "나염": "Printing",
  "자수": "Embroidery",
  "워싱": "Washing",
  "후가공": "Finishing",
  "준비": "Ready",
  "준비중": "Preparing",
  "발주완료": "Ordered",
  "입고완료": "Received",
  "대기": "Waiting",
  "야드": "yd",
  "장": "pcs",
  "개": "pcs",
  "벌": "sets",
  "세트": "sets",
  "롤": "rolls",
};

export function translateWorkOrderDisplayText(value: string | null | undefined, locale: Locale) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return value ?? "";
  if (locale !== "en") return KO_VALUE_LABELS[normalized.toLowerCase()] ?? value ?? "";
  return EN_VALUE_LABELS[normalized] ?? value ?? "";
}
