import type { CompanyFilePolicySettings } from "@/lib/admin/settings/companyTypes";
import { formatPbpBinaryBytes } from "@/lib/utils/formatters";
import { DEFAULT_PLAN_DEFINITIONS } from "./defaultPlans";
import type { ResolvedCompanyPlanPolicy } from "./planTypes";

export type StorageQuotaPolicySource = "plan" | "company_file_policy" | "override" | "fallback";
export type StorageQuotaStatusTone = "normal" | "caution" | "danger";
export type StorageCapacityState =
  | "healthy"
  | "warning"
  | "grace"
  | "read_only"
  | "blocked"
  | "over_limit"
  | "reconciliation_required";

export interface ResolvedStorageQuotaPolicy {
  limitBytes: number;
  limitLabel: string;
  warningThresholdPercent: number;
  dangerThresholdPercent: number;
  source: StorageQuotaPolicySource;
  sourceLabel: string;
  includeTrashInUsage: boolean;
}

export interface StorageUsageSummaryInput {
  activeBytes: number;
  trashBytes: number;
  quotaPolicy: ResolvedStorageQuotaPolicy;
}

export interface ResolvedStorageUsageSummary {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  reservedBytes: number;
  usedLabel: string;
  limitLabel: string;
  usagePercent: number;
  displayUsagePercent: number;
  statusLabel: string;
  statusTone: StorageQuotaStatusTone;
  state: StorageCapacityState;
  sourceLabel: string;
}

export const BYTES_PER_MB = 1024 ** 2;
export const BYTES_PER_GB = 1024 ** 3;
export const DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT = 80;
export const DEFAULT_STORAGE_DANGER_GAP_PERCENT = 10;

const litePlan = DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.code === "lite");

export const DEFAULT_ADMIN_STORAGE_QUOTA_BYTES =
  litePlan?.storage.includedStorageBytes ?? 500 * BYTES_PER_MB;

export function formatStorageBytes(bytes: number): string {
  return formatPbpBinaryBytes(bytes, {
    zeroLabel: "0B",
    gbFractionDigits: 1,
    mbFractionDigits: 0,
    kbFractionDigits: 0,
  });
}

export function normalizeStorageWarningThresholdPercent(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT;
  return Math.min(100, Math.max(1, Math.trunc(value ?? DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT)));
}

function normalizeStorageLimitBytes(value: number | null | undefined, fallback = DEFAULT_ADMIN_STORAGE_QUOTA_BYTES): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) return fallback;
  return Math.max(1, Math.trunc(value ?? fallback));
}

export function getStorageDangerThresholdPercent(warningThresholdPercent: number): number {
  return Math.min(100, warningThresholdPercent + DEFAULT_STORAGE_DANGER_GAP_PERCENT);
}

export function getStorageUsageStatus(input: {
  usedBytes: number;
  limitBytes: number;
  warningThresholdPercent: number;
}): {
  statusTone: StorageQuotaStatusTone;
  statusLabel: string;
  usagePercent: number;
  displayUsagePercent: number;
  state: StorageCapacityState;
} {
  const safeLimitBytes = normalizeStorageLimitBytes(input.limitBytes);
  const safeUsedBytes = Number.isFinite(input.usedBytes) ? Math.max(0, input.usedBytes) : 0;
  const warningThresholdPercent = normalizeStorageWarningThresholdPercent(input.warningThresholdPercent);
  const usagePercent = Math.round((safeUsedBytes / safeLimitBytes) * 100);
  const displayUsagePercent = Math.min(100, Math.max(0, usagePercent));
  const statusTone: StorageQuotaStatusTone =
    usagePercent >= 100 ? "danger" : usagePercent >= warningThresholdPercent ? "caution" : "normal";
  const state: StorageCapacityState =
    usagePercent > 100 ? "over_limit" : usagePercent >= 100 ? "blocked" : usagePercent >= warningThresholdPercent ? "warning" : "healthy";
  const statusLabel = statusTone === "danger" ? "차단" : statusTone === "caution" ? "주의" : "정상";

  return { statusTone, statusLabel, usagePercent, displayUsagePercent, state };
}

export function resolveStorageQuotaFromCompanyFilePolicy(
  filePolicy: CompanyFilePolicySettings,
): ResolvedStorageQuotaPolicy {
  const limitBytes = normalizeStorageLimitBytes(filePolicy.storageLimitGb * BYTES_PER_GB);
  const warningThresholdPercent = normalizeStorageWarningThresholdPercent(filePolicy.warningThresholdPercent);

  return {
    limitBytes,
    limitLabel: formatStorageBytes(limitBytes),
    warningThresholdPercent,
    dangerThresholdPercent: getStorageDangerThresholdPercent(warningThresholdPercent),
    source: "company_file_policy",
    sourceLabel: "고객사 파일 정책",
    includeTrashInUsage: filePolicy.includeTrashInUsage,
  };
}

export function resolveStorageQuotaFromCompanyPlanPolicy(
  policy: ResolvedCompanyPlanPolicy,
  includeTrashInUsage = true,
): ResolvedStorageQuotaPolicy {
  const limitBytes = normalizeStorageLimitBytes(policy.storageLimitBytes);
  const source: StorageQuotaPolicySource = policy.source.storage === "override" ? "override" : "plan";

  return {
    limitBytes,
    limitLabel: formatStorageBytes(limitBytes),
    warningThresholdPercent: DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT,
    dangerThresholdPercent: getStorageDangerThresholdPercent(DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT),
    source,
    sourceLabel: source === "override" ? "고객사 저장공간 override" : "요금제 저장공간",
    includeTrashInUsage,
  };
}

export function getDefaultAdminStorageQuotaPolicy(includeTrashInUsage = true): ResolvedStorageQuotaPolicy {
  return {
    limitBytes: DEFAULT_ADMIN_STORAGE_QUOTA_BYTES,
    limitLabel: formatStorageBytes(DEFAULT_ADMIN_STORAGE_QUOTA_BYTES),
    warningThresholdPercent: DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT,
    dangerThresholdPercent: getStorageDangerThresholdPercent(DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT),
    source: "fallback",
    sourceLabel: "기본 Lite 저장공간 정책",
    includeTrashInUsage,
  };
}

export function buildResolvedStorageUsageSummary(input: StorageUsageSummaryInput): ResolvedStorageUsageSummary {
  const activeBytes = Number.isFinite(input.activeBytes) ? Math.max(0, input.activeBytes) : 0;
  const trashBytes = Number.isFinite(input.trashBytes) ? Math.max(0, input.trashBytes) : 0;
  const usedBytes = activeBytes + (input.quotaPolicy.includeTrashInUsage ? trashBytes : 0);
  const remainingBytes = Math.max(0, input.quotaPolicy.limitBytes - usedBytes);
  const status = getStorageUsageStatus({
    usedBytes,
    limitBytes: input.quotaPolicy.limitBytes,
    warningThresholdPercent: input.quotaPolicy.warningThresholdPercent,
  });

  return {
    usedBytes,
    limitBytes: input.quotaPolicy.limitBytes,
    remainingBytes,
    reservedBytes: 0,
    usedLabel: formatStorageBytes(usedBytes),
    limitLabel: input.quotaPolicy.limitLabel,
    usagePercent: status.usagePercent,
    displayUsagePercent: status.displayUsagePercent,
    statusLabel: status.statusLabel,
    statusTone: status.statusTone,
    state: status.state,
    sourceLabel: input.quotaPolicy.sourceLabel,
  };
}

export const STORAGE_QUOTA_UPLOAD_WARNING_RATIO = 0.8;

export const STORAGE_QUOTA_UPLOAD_ERROR_CODES = {
  exceeded: "STORAGE_QUOTA_EXCEEDED",
  unavailable: "STORAGE_QUOTA_UNAVAILABLE",
} as const;

export type StorageQuotaUploadDecisionStatus = "allowed" | "warning" | "blocked";

export interface StorageQuotaUploadDecision {
  status: StorageQuotaUploadDecisionStatus;
  storageLimitBytes: number;
  storageUsedBytes: number;
  replaceableBytes: number;
  incomingSizeBytes: number;
  projectedUsedBytes: number;
  usageRatio: number;
  usagePercent: number;
  displayUsagePercent: number;
  remainingBytes: number;
  state: StorageCapacityState;
  warningThresholdRatio: number;
  message: string;
}

function normalizeQuotaBytes(value: number | null | undefined): number {
  const numericValue = Math.trunc(Number(value ?? 0));
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
}

function getUploadUsageRatio(usedBytes: number, limitBytes: number): number {
  if (!Number.isFinite(limitBytes) || limitBytes <= 0) return 0;
  return usedBytes / limitBytes;
}

export function evaluateStorageQuotaForUpload(input: {
  storageLimitBytes: number;
  storageUsedBytes: number;
  incomingSizeBytes: number;
  replaceableBytes?: number | null;
  warningThresholdRatio?: number | null;
}): StorageQuotaUploadDecision {
  const storageLimitBytes = Math.max(1, normalizeQuotaBytes(input.storageLimitBytes));
  const storageUsedBytes = normalizeQuotaBytes(input.storageUsedBytes);
  const incomingSizeBytes = normalizeQuotaBytes(input.incomingSizeBytes);
  const replaceableBytes = Math.min(storageUsedBytes, normalizeQuotaBytes(input.replaceableBytes));
  const warningThresholdRatio = Number.isFinite(input.warningThresholdRatio)
    ? Math.min(1, Math.max(0.01, Number(input.warningThresholdRatio)))
    : STORAGE_QUOTA_UPLOAD_WARNING_RATIO;
  const projectedUsedBytes = Math.max(0, storageUsedBytes - replaceableBytes) + incomingSizeBytes;
  const usageRatio = getUploadUsageRatio(projectedUsedBytes, storageLimitBytes);
  const usagePercent = Math.round(usageRatio * 100);
  const displayUsagePercent = Math.min(100, Math.max(0, usagePercent));
  const remainingBytes = Math.max(0, storageLimitBytes - projectedUsedBytes);

  if (projectedUsedBytes > storageLimitBytes) {
    return {
      status: "blocked",
      storageLimitBytes,
      storageUsedBytes,
      replaceableBytes,
      incomingSizeBytes,
      projectedUsedBytes,
      usageRatio,
      usagePercent,
      displayUsagePercent,
      remainingBytes,
      state: "blocked",
      warningThresholdRatio,
      message: `저장공간 한도 ${formatStorageBytes(storageLimitBytes)}를 초과하여 새 파일을 업로드할 수 없습니다.`,
    };
  }

  if (usageRatio >= warningThresholdRatio) {
    return {
      status: "warning",
      storageLimitBytes,
      storageUsedBytes,
      replaceableBytes,
      incomingSizeBytes,
      projectedUsedBytes,
      usageRatio,
      usagePercent,
      displayUsagePercent,
      remainingBytes,
      state: "warning",
      warningThresholdRatio,
      message: `저장공간 사용량이 ${Math.round(warningThresholdRatio * 100)}% 이상입니다.`,
    };
  }

  return {
    status: "allowed",
    storageLimitBytes,
    storageUsedBytes,
    replaceableBytes,
    incomingSizeBytes,
    projectedUsedBytes,
    usageRatio,
    usagePercent,
    displayUsagePercent,
    remainingBytes,
    state: "healthy",
    warningThresholdRatio,
    message: "업로드 가능한 저장공간 상태입니다.",
  };
}
