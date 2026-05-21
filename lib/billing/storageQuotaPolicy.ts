import type { CompanyFilePolicySettings } from "@/lib/admin/settings/companyTypes";
import { formatPbpBinaryBytes } from "@/lib/utils/formatters";
import { DEFAULT_PLAN_DEFINITIONS } from "./defaultPlans";
import type { ResolvedCompanyPlanPolicy } from "./planTypes";

export type StorageQuotaPolicySource = "plan" | "company_file_policy" | "override" | "fallback";
export type StorageQuotaStatusTone = "normal" | "caution" | "danger";

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
  usedLabel: string;
  limitLabel: string;
  usagePercent: number;
  statusLabel: string;
  statusTone: StorageQuotaStatusTone;
  sourceLabel: string;
}

export const BYTES_PER_GB = 1024 ** 3;
export const DEFAULT_STORAGE_WARNING_THRESHOLD_PERCENT = 80;
export const DEFAULT_STORAGE_DANGER_GAP_PERCENT = 10;

const starterPlan = DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.code === "starter");

export const DEFAULT_ADMIN_STORAGE_QUOTA_BYTES =
  starterPlan?.storage.includedStorageBytes ?? 5 * BYTES_PER_GB;

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
}): { statusTone: StorageQuotaStatusTone; statusLabel: string; usagePercent: number } {
  const safeLimitBytes = normalizeStorageLimitBytes(input.limitBytes);
  const safeUsedBytes = Number.isFinite(input.usedBytes) ? Math.max(0, input.usedBytes) : 0;
  const warningThresholdPercent = normalizeStorageWarningThresholdPercent(input.warningThresholdPercent);
  const usagePercent = Math.min(100, Math.round((safeUsedBytes / safeLimitBytes) * 100));
  const statusTone: StorageQuotaStatusTone =
    usagePercent >= 100 ? "danger" : usagePercent >= warningThresholdPercent ? "caution" : "normal";
  const statusLabel = statusTone === "danger" ? "위험" : statusTone === "caution" ? "주의" : "정상";

  return { statusTone, statusLabel, usagePercent };
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
    sourceLabel: "기본 Starter 저장공간 정책",
    includeTrashInUsage,
  };
}

export function buildResolvedStorageUsageSummary(input: StorageUsageSummaryInput): ResolvedStorageUsageSummary {
  const activeBytes = Number.isFinite(input.activeBytes) ? Math.max(0, input.activeBytes) : 0;
  const trashBytes = Number.isFinite(input.trashBytes) ? Math.max(0, input.trashBytes) : 0;
  const usedBytes = activeBytes + (input.quotaPolicy.includeTrashInUsage ? trashBytes : 0);
  const status = getStorageUsageStatus({
    usedBytes,
    limitBytes: input.quotaPolicy.limitBytes,
    warningThresholdPercent: input.quotaPolicy.warningThresholdPercent,
  });

  return {
    usedBytes,
    limitBytes: input.quotaPolicy.limitBytes,
    usedLabel: formatStorageBytes(usedBytes),
    limitLabel: input.quotaPolicy.limitLabel,
    usagePercent: status.usagePercent,
    statusLabel: status.statusLabel,
    statusTone: status.statusTone,
    sourceLabel: input.quotaPolicy.sourceLabel,
  };
}
