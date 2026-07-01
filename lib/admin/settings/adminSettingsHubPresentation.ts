import type { WaflSettingsTabTone } from "@/components/admin/common/WaflSettingsTabs";
import type { AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import type { AdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";
import type { AdminAccountSettingsOverview } from "@/lib/admin/settings/adminAccountSettingsOverview";
import type { CustomerPolicyDocumentCategory } from "@/lib/policies/customerPolicyDocuments";

export type AdminCurrentCompanyPayload = {
  ok?: boolean;
  billing?: AdminBillingPlanOverview;
  account?: AdminAccountSettingsOverview;
};

export type CompanyAccountRequestStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "rejected"
  | "cancelled";

export type CompanyAccountRequestType = "company_info_change" | "account_deactivation";

export type CompanyAccountRequestRecord = {
  id: string;
  requestType: CompanyAccountRequestType;
  requestStatus: CompanyAccountRequestStatus;
  requestTitle: string;
  requestMessage: string;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewMessage: string | null;
  createdAt: string;
};

export type CompanyAccountRequestsPayload = {
  ok?: boolean;
  requests?: CompanyAccountRequestRecord[];
};

export type CompanySubscriptionSnapshot = {
  id: string | null;
  companyId: string;
  planCode: string;
  planLabel: string;
  status: string;
  statusLabel: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStartedAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelScheduledAt: string | null;
  canceledAt: string | null;
  storageLimitBytes: number;
  storageUsedBytes: number;
  storageUsageRatio: number;
  storageUsagePercent: number;
  storageDisplayUsagePercent: number;
  storageRemainingBytes: number;
  storageState: "healthy" | "warning" | "blocked" | "over_limit";
  memberLimit: number;
  activeMemberCount: number;
  source: "company_subscriptions" | "company_fallback";
  updatedAt: string | null;
};

export type CompanySubscriptionPayload = {
  ok?: boolean;
  subscription?: CompanySubscriptionSnapshot;
};

export type CompanyFeedbackType = "feature" | "bug" | "improvement";

export type CompanyFeedbackStatus = "received" | "reviewing" | "answered" | "closed";

export type CompanyFeedbackRequestRecord = {
  id: string;
  feedbackType: CompanyFeedbackType;
  feedbackStatus: CompanyFeedbackStatus;
  title: string;
  message: string;
  reviewerName: string | null;
  reviewedAt: string | null;
  responseMessage: string | null;
  createdAt: string;
};

export type CompanyFeedbackPayload = {
  ok?: boolean;
  requests?: CompanyFeedbackRequestRecord[];
  feedback?: CompanyFeedbackRequestRecord;
};

export type CustomerPolicyMarkdownDocument = {
  id: string;
  title: string;
  subtitle: string;
  category: CustomerPolicyDocumentCategory;
  categoryLabel: string;
  versionLabel: string;
  effectiveDateLabel: string;
  requiredForApproval: boolean;
  sourceFileName: string;
  sourceNote: string | null;
  markdown: string;
};

export type CustomerPolicyMarkdownPayload = {
  ok?: boolean;
  document?: CustomerPolicyMarkdownDocument;
  error?: string;
};

export const settingsMenuToneMap: Record<string, WaflSettingsTabTone> = {
  blue: "info",
  amber: "warning",
  emerald: "success",
  violet: "brand",
};

export const policyCategoryTone: Record<CustomerPolicyDocumentCategory, AdminStatusBadgeTone> = {
  service: "brand",
  privacy: "info",
  billing: "success",
  data: "warning",
  operation: "neutral",
};

export const requestStatusTone: Record<CompanyAccountRequestStatus, AdminStatusBadgeTone> = {
  pending: "warning",
  reviewing: "info",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatSettingsRequestDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatSettingsDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.min(999, Math.max(0, Math.round(value * 100)))}%`;
}

export function resolveSubscriptionStatusTone(status: string): AdminStatusBadgeTone {
  if (status === "active" || status === "trialing") return "success";
  if (
    status === "past_due" ||
    status === "payment_failed" ||
    status === "cancel_scheduled"
  )
    return "warning";
  if (status === "canceled" || status === "suspended") return "danger";
  return "neutral";
}
