export const ADMIN_FILE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
export const ADMIN_ATTACHMENT_COUNT_LIMIT = 20;
export const ADMIN_TRASH_COUNT_LIMIT = 20;

export const ADMIN_WORKORDER_FLOW_BUCKETS = [
  { label: "작성", statuses: ["draft", "rejected"] },
  { label: "검토", statuses: ["review_requested"] },
  { label: "발주", statuses: ["review_completed"] },
  { label: "입고", statuses: ["inspection"] },
  { label: "완료", statuses: ["completed"] },
] as const;

export const ADMIN_PARTNER_DISTRIBUTION_BUCKETS = [
  { label: "공장", itemTypes: ["factory"] },
  { label: "원단", itemTypes: ["fabric"] },
  { label: "부자재", itemTypes: ["subsidiary"] },
  { label: "외주", itemTypes: ["outsourcing"] },
] as const;

export const ADMIN_FILE_USAGE_LABELS = {
  total: "전체 사용량",
  active: "첨부파일",
  trash: "휴지통",
  quotaLabel: "5.0GB",
} as const;

export const ADMIN_STAT_SUMMARY_TEXT = {
  totalWorkorders: {
    label: "전체 작업지시서",
    href: null,
    description: "DB 기준 전체 작업지시서 수",
    accent: "bg-blue-50 text-blue-700",
  },
  partnerCount: {
    label: "협력업체 수",
    href: null,
    description: "활성 협력업체 수",
    accent: "bg-emerald-50 text-emerald-700",
  },
  fileUsage: {
    label: "파일 사용량",
    href: null,
    description: "현재 첨부파일 사용량",
    accent: "bg-violet-50 text-violet-700",
  },
  completedThisMonth: {
    label: "완료된 작업지시서",
    href: null,
    description: "이번달 완료 처리",
    accent: "bg-stone-100 text-stone-700",
  },
} as const;
