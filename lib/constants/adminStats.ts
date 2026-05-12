import {
  DEFAULT_ADMIN_STORAGE_QUOTA_BYTES,
  formatStorageBytes,
} from "@/lib/billing/storageQuotaPolicy";

export const ADMIN_FILE_LIMIT_BYTES = DEFAULT_ADMIN_STORAGE_QUOTA_BYTES;
export const ADMIN_ATTACHMENT_COUNT_LIMIT = 20;
export const ADMIN_TRASH_COUNT_LIMIT = 20;

export const ADMIN_WORKORDER_FLOW_BUCKETS = [
  { labelKey: "writing", statuses: ["draft", "rejected"] },
  { labelKey: "review", statuses: ["review_requested"] },
  { labelKey: "order", statuses: ["review_completed"] },
  { labelKey: "inbound", statuses: ["inspection"] },
  { labelKey: "completed", statuses: ["completed"] },
] as const;

export const ADMIN_PARTNER_DISTRIBUTION_BUCKETS = [
  { labelKey: "factory", itemTypes: ["factory"] },
  { labelKey: "fabric", itemTypes: ["fabric"] },
  { labelKey: "subsidiary", itemTypes: ["subsidiary"] },
  { labelKey: "outsourcing", itemTypes: ["outsourcing"] },
] as const;

export const ADMIN_FILE_USAGE_LABELS = {
  total: "전체 사용량",
  active: "첨부파일",
  trash: "휴지통",
  quotaLabel: formatStorageBytes(ADMIN_FILE_LIMIT_BYTES),
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

export const ADMIN_STATS_EVENT_TYPES = [
  "WORKORDER_CREATED",
  "STATUS_CHANGED",
  "INSPECTION_COMPLETED",
  "DEFECT_REPORTED",
  "INBOUND_DELAYED",
] as const;

export const ADMIN_STATS_RETAINED_ROUND_METADATA_KEYS = [
  "reorderRound",
  "round",
  "productionRound",
] as const;
