import "server-only";

import { listAdminFileManagementRows } from "@/lib/admin/files/serverActions";
import { getCompanySettings } from "@/lib/admin/settings/companyRepository";
import { buildResolvedStorageUsageSummary, formatStorageBytes, getDefaultAdminStorageQuotaPolicy } from "@/lib/billing/storageQuotaPolicy";
import { getCurrentCompanySubscription } from "@/lib/billing/companySubscriptionRepository";
import type { AdminDashboardPlanStorageSummary } from "@/lib/admin/dashboard/adminPlanStorageSummary.types";

function buildMemberStatus(input: {
  activeMemberCount: number;
  memberLimit: number;
}): { memberUsageLabel: string; memberStatusLabel: string; memberStatusTone: "normal" | "caution" } {
  const activeMemberCount = Math.max(0, Math.trunc(input.activeMemberCount));
  const memberLimit = Math.max(0, Math.trunc(input.memberLimit));
  const memberUsageLabel = memberLimit > 0 ? `${activeMemberCount} / ${memberLimit}명` : `${activeMemberCount}명`;
  const overLimit = memberLimit > 0 && activeMemberCount > memberLimit;

  return {
    memberUsageLabel,
    memberStatusLabel: overLimit ? "한도 초과" : "한도 내",
    memberStatusTone: overLimit ? "caution" : "normal",
  };
}

export async function buildAdminDashboardPlanStorageSummary(
  companyId: string,
): Promise<AdminDashboardPlanStorageSummary | null> {
  const normalizedCompanyId = companyId.trim();
  if (!normalizedCompanyId) return null;

  const [subscription, settings] = await Promise.all([
    getCurrentCompanySubscription(normalizedCompanyId),
    getCompanySettings(normalizedCompanyId),
  ]);

  const rows = await listAdminFileManagementRows({
    companyId: normalizedCompanyId,
    trashRetentionDays: settings.filePolicy.trashRetentionDays,
  });
  const activeBytes = rows.attachments.reduce((total, item) => total + item.fileSizeBytes, 0);
  const trashBytes = rows.trashItems.reduce((total, item) => total + item.fileSizeBytes, 0);
  const baseQuotaPolicy = getDefaultAdminStorageQuotaPolicy(true);
  const usageSummary = buildResolvedStorageUsageSummary({
    activeBytes: subscription?.storageUsedBytes ?? activeBytes,
    trashBytes: subscription ? 0 : trashBytes,
    quotaPolicy: {
      ...baseQuotaPolicy,
      limitBytes: subscription?.storageLimitBytes ?? baseQuotaPolicy.limitBytes,
      limitLabel: subscription ? formatStorageBytes(subscription.storageLimitBytes) : baseQuotaPolicy.limitLabel,
      source: subscription ? "plan" : "fallback",
      sourceLabel: subscription?.source === "company_subscriptions" ? "구독 DB 저장공간" : "기본 저장공간 정책",
      includeTrashInUsage: true,
    },
  });
  const memberStatus = buildMemberStatus({
    activeMemberCount: subscription?.activeMemberCount ?? 0,
    memberLimit: subscription?.memberLimit ?? 0,
  });

  return {
    planLabel: subscription?.planLabel ?? "기본 플랜",
    statusLabel: subscription?.statusLabel ?? "상태 미확정",
    sourceLabel: subscription?.source === "company_subscriptions" ? "구독 DB" : "회사 기본값",
    storageUsedLabel: usageSummary.usedLabel,
    storageLimitLabel: usageSummary.limitLabel,
    storageUsagePercent: usageSummary.usagePercent,
    storageDisplayUsagePercent: usageSummary.displayUsagePercent,
    storageStatusLabel: usageSummary.statusLabel,
    storageStatusTone: usageSummary.statusTone,
    activeStorageLabel: formatStorageBytes(activeBytes),
    trashStorageLabel: formatStorageBytes(trashBytes),
    memberUsageLabel: memberStatus.memberUsageLabel,
    memberStatusLabel: memberStatus.memberStatusLabel,
    memberStatusTone: memberStatus.memberStatusTone,
    includeTrashInUsage: settings.filePolicy.includeTrashInUsage,
    policySourceLabel: usageSummary.sourceLabel,
    subscriptionHref: "/workspace/subscription",
    storageHref: "/workspace/files",
  };
}
