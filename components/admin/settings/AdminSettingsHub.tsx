"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminModal } from "@/components/admin/layout/AdminModal";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import WaflSettingCard from "@/components/admin/common/WaflSettingCard";
import WaflSettingsSectionGroup from "@/components/admin/common/WaflSettingsSectionGroup";
import WaflSettingsTabs, { type WaflSettingsTabTone } from "@/components/admin/common/WaflSettingsTabs";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import {
  ADMIN_SETTINGS_MENU_ITEMS,
  ADMIN_SETTINGS_NOTICE_BY_ID,
  type AdminSettingsMenuId,
} from "@/lib/admin/settings/adminSettingsHub";
import { type AdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";
import { formatStorageBytes } from "@/lib/billing/storageQuotaPolicy";
import { formatPbpNumberWithUnit } from "@/lib/utils/formatters";
import { type AdminAccountSettingsOverview } from "@/lib/admin/settings/adminAccountSettingsOverview";
import AdminCompanyFilesPanel from "@/components/admin/settings/AdminCompanyFilesPanel";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  CUSTOMER_POLICY_DOCUMENTS,
  getRequiredPolicyDocumentCount,
  type CustomerPolicyDocument,
  type CustomerPolicyDocumentCategory,
} from "@/lib/policies/customerPolicyDocuments";

type AdminCurrentCompanyPayload = {
  ok?: boolean;
  billing?: AdminBillingPlanOverview;
  account?: AdminAccountSettingsOverview;
};

type CompanyAccountRequestStatus = "pending" | "reviewing" | "approved" | "rejected" | "cancelled";

type CompanyAccountRequestType = "company_info_change" | "account_deactivation";

type CompanyAccountRequestRecord = {
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

type CompanyAccountRequestsPayload = {
  ok?: boolean;
  requests?: CompanyAccountRequestRecord[];
};

type CompanySubscriptionSnapshot = {
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
  memberLimit: number;
  activeMemberCount: number;
  source: "company_subscriptions" | "company_fallback";
  updatedAt: string | null;
};

type CompanySubscriptionPayload = {
  ok?: boolean;
  subscription?: CompanySubscriptionSnapshot;
};

type CompanyFeedbackType = "feature" | "bug" | "improvement";

type CompanyFeedbackStatus = "received" | "reviewing" | "answered" | "closed";

type CompanyFeedbackRequestRecord = {
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

type CompanyFeedbackPayload = {
  ok?: boolean;
  requests?: CompanyFeedbackRequestRecord[];
  feedback?: CompanyFeedbackRequestRecord;
};

type CustomerPolicyMarkdownDocument = {
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

type CustomerPolicyMarkdownPayload = {
  ok?: boolean;
  document?: CustomerPolicyMarkdownDocument;
  error?: string;
};

const settingsMenuToneMap: Record<string, WaflSettingsTabTone> = {
  blue: "info",
  amber: "warning",
  emerald: "success",
  violet: "brand",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

const policyCategoryTone: Record<CustomerPolicyDocumentCategory, AdminStatusBadgeTone> = {
  service: "brand",
  privacy: "info",
  billing: "success",
  data: "warning",
  operation: "neutral",
};

function formatSettingsRequestDate(value: string): string {
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

const requestStatusTone: Record<CompanyAccountRequestStatus, AdminStatusBadgeTone> = {
  pending: "warning",
  reviewing: "info",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

function resolveRequestStatusLabel(status: CompanyAccountRequestStatus, t: ReturnType<typeof useAdminTranslation>): string {
  if (status === "reviewing") return t("settings.accountRequest.status.reviewing", "검토 중");
  if (status === "approved") return t("settings.accountRequest.status.approved", "승인됨");
  if (status === "rejected") return t("settings.accountRequest.status.rejected", "반려됨");
  if (status === "cancelled") return t("settings.accountRequest.status.cancelled", "취소됨");
  return t("settings.accountRequest.status.pending", "접수됨");
}

function resolveRequestTypeLabel(type: CompanyAccountRequestType, t: ReturnType<typeof useAdminTranslation>): string {
  if (type === "account_deactivation") return t("settings.accountRequest.type.accountDeactivation", "계정 비활성화");
  return t("settings.accountRequest.type.companyInfoChange", "회사 정보 변경");
}

function formatSettingsDateTime(value: string | null): string {
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

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.min(999, Math.max(0, Math.round(value * 100)))}%`;
}

function resolveSubscriptionStatusTone(status: string): AdminStatusBadgeTone {
  if (status === "active" || status === "trialing") return "success";
  if (status === "past_due" || status === "payment_failed" || status === "cancel_scheduled") return "warning";
  if (status === "canceled" || status === "suspended") return "danger";
  return "neutral";
}

function BillingPlanPanel({
  overview,
  loadState,
  subscription,
  subscriptionLoadState,
}: {
  overview: AdminBillingPlanOverview;
  loadState: "idle" | "loading" | "loaded" | "failed";
  subscription: CompanySubscriptionSnapshot | null;
  subscriptionLoadState: "idle" | "loading" | "loaded" | "failed";
}) {
  const t = useAdminTranslation();
  const subscriptionStatusTone = subscription ? resolveSubscriptionStatusTone(subscription.status) : "neutral";
  const storageLimitLabel = subscription ? formatStorageBytes(subscription.storageLimitBytes) : "-";
  const storageUsedLabel = subscription ? formatStorageBytes(subscription.storageUsedBytes) : "-";
  const storageUsageLabel = subscription ? formatPercent(subscription.storageUsageRatio) : "-";
  const storageUsageTone: AdminStatusBadgeTone = subscription && subscription.storageUsageRatio >= 1
    ? "danger"
    : subscription && subscription.storageUsageRatio >= 0.8
      ? "warning"
      : "success";
  const memberUsageLabel = subscription
    ? `${formatPbpNumberWithUnit(subscription.activeMemberCount, "명")} / ${formatPbpNumberWithUnit(subscription.memberLimit, "명")}`
    : "-";
  const memberUsageTone: AdminStatusBadgeTone = subscription && subscription.activeMemberCount > subscription.memberLimit ? "warning" : "success";
  const planEndsAt = subscription?.currentPeriodEndsAt ?? subscription?.trialEndsAt ?? null;
  const sourceLabel = subscription?.source === "company_subscriptions"
    ? t("settings.billing.sourceSubscription", "구독 데이터")
    : subscription?.source === "company_fallback"
      ? t("settings.billing.sourceCompanyFallback", "회사 기본값")
      : overview.dataSourceLabel;
  const isLoadingSubscription = subscriptionLoadState === "loading";
  const isSubscriptionFailed = subscriptionLoadState === "failed" || loadState === "failed";
  const normalizedActions = overview.actions.slice(0, 3);

  return (
    <WaflSectionPanel
      eyebrow={t("settings.billing.eyebrow", "요금제·저장공간")}
      title={overview.title}
      description={t("settings.billing.redesignedDescription", "현재 요금제, 저장공간, 멤버 한도만 빠르게 확인하고 필요한 변경은 바로 요청합니다.")}
      actions={
        <>
          <AdminStatusBadge tone={subscriptionStatusTone}>{subscription?.planLabel ?? overview.currentPlanLabel}</AdminStatusBadge>
          <AdminStatusBadge tone={subscriptionStatusTone}>{subscription?.statusLabel ?? overview.billingStatusLabel}</AdminStatusBadge>
        </>
      }
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      {isSubscriptionFailed ? (
        <WaflSettingCard
          title={t("settings.billing.subscriptionFailedTitle", "요금제 데이터를 불러오지 못했습니다.")}
          description={t("settings.billing.subscriptionFailedDescription", "회사 구독 데이터 조회에 실패했습니다. 기존 환경설정 요약값을 임시로 표시합니다.")}
          tone="warning"
          density="compact"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <WaflSettingsSectionGroup
          eyebrow={t("settings.billing.summaryEyebrow", "현재 기준")}
          title={t("settings.billing.redesignedSummaryTitle", "요금제·저장공간 현황")}
          description={t("settings.billing.redesignedSummaryDescription", "고객사가 지금 사용하는 요금제와 한도만 표시합니다.")}
          badge={<AdminStatusBadge tone={subscriptionLoadState === "failed" ? "warning" : "neutral"} size="xs">{isLoadingSubscription ? t("common.loadingShort", "조회 중") : sourceLabel}</AdminStatusBadge>}
          tone="success"
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
              <p className="text-xs font-bold text-[var(--pbp-text-subtle)]">{t("settings.billing.currentPlanLabel", "현재 요금제")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <strong className="text-xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">{subscription?.planLabel ?? overview.currentPlanLabel}</strong>
                {subscription ? <AdminStatusBadge tone="neutral" size="xs">{subscription.planCode}</AdminStatusBadge> : null}
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--pbp-text-muted)]">{t("settings.billing.planEndLabel", "요금제 종료일")}: {formatSettingsDateTime(planEndsAt)}</p>
            </div>

            <div className="rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[var(--pbp-text-subtle)]">{t("settings.billing.storageUsageLabel", "저장공간 사용량")}</p>
                  <strong className="mt-2 block text-xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">{storageUsageLabel}</strong>
                </div>
                <AdminStatusBadge tone={storageUsageTone} size="xs">{storageUsedLabel} / {storageLimitLabel}</AdminStatusBadge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--pbp-surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--pbp-status-success-fg)]"
                  style={{ width: `${Math.min(100, Math.max(0, Math.round((subscription?.storageUsageRatio ?? 0) * 100)))}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--pbp-text-muted)]">{t("settings.billing.storageUsageDescription", "활성 회사 파일 기준의 저장공간 사용량입니다.")}</p>
            </div>

            <div className="rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
              <p className="text-xs font-bold text-[var(--pbp-text-subtle)]">{t("settings.billing.memberUsageLabel", "멤버 사용량")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <strong className="text-xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">{memberUsageLabel}</strong>
                <AdminStatusBadge tone={memberUsageTone} size="xs">{memberUsageTone === "warning" ? t("settings.billing.memberOverLimit", "초과") : t("settings.billing.withinLimit", "한도 내")}</AdminStatusBadge>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--pbp-text-muted)]">{t("settings.billing.memberUsageDescription", "현재 고객사 활성 멤버 수와 요금제 멤버 한도입니다.")}</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)]">
            {[
              [t("settings.billing.statusLabel", "구독 상태"), subscription?.statusLabel ?? overview.billingStatusLabel],
              [t("settings.billing.planEndLabel", "요금제 종료일"), formatSettingsDateTime(planEndsAt)],
              [t("settings.billing.updatedAtLabel", "최근 갱신"), formatSettingsDateTime(subscription?.updatedAt ?? null)],
              [t("settings.billing.sourceLabel", "데이터 기준"), sourceLabel],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 border-b border-[var(--pbp-border)] px-4 py-3 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                <span className="text-xs font-bold text-[var(--pbp-text-subtle)]">{label}</span>
                <span className="text-sm font-semibold text-[var(--pbp-text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </WaflSettingsSectionGroup>

        <WaflSettingsSectionGroup
          eyebrow={t("settings.billing.actionsEyebrow", "관리")}
          title={t("settings.billing.actionsTitle", "변경·결제")}
          description={t("settings.billing.actionsDescription", "필요한 항목을 선택해 변경 요청 또는 결제 문의로 이어갑니다.")}
          tone="info"
        >
          <div className="grid gap-2">
            {normalizedActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-left transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-soft)]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[var(--pbp-text-primary)]">{action.label}</span>
                  <span className="mt-1 block line-clamp-1 text-xs text-[var(--pbp-text-muted)]">{action.description}</span>
                </span>
                <AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--pbp-text-muted)]">
            {t("settings.billing.actionsFootnote", "정식 결제창 연결 전까지 변경 요청은 운영팀 검토 흐름으로 접수됩니다.")}
          </p>
        </WaflSettingsSectionGroup>
      </div>
    </WaflSectionPanel>
  );
}

function AccountSettingsPanel({
  overview,
  loadState,
  requests,
  requestsLoadState,
  onRequestSubmitted,
}: {
  overview: AdminAccountSettingsOverview;
  loadState: "idle" | "loading" | "loaded" | "failed";
  requests: CompanyAccountRequestRecord[];
  requestsLoadState: "idle" | "loading" | "loaded" | "failed";
  onRequestSubmitted: () => void;
}) {
  const t = useAdminTranslation();
  const [activeRequestType, setActiveRequestType] = useState<"company_info_change" | "account_deactivation" | null>(null);
  const [activeRequestMetricId, setActiveRequestMetricId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "submitting" | "submitted" | "failed">("idle");
  const [requestFeedback, setRequestFeedback] = useState("");
  const [requestFeedbackTone, setRequestFeedbackTone] = useState<ToastTone>("info");
  const [requestFeedbackEventKey, setRequestFeedbackEventKey] = useState(0);

  const deactivationAction = overview.actions.find((action) => action.requestType === "account_deactivation") ?? null;
  const activeRequestMetric = overview.metrics.find((metric) => metric.id === activeRequestMetricId) ?? null;
  const editableMetricIds = useMemo(() => new Set(["company-name", "business-registration-number", "company-address"]), []);
  const canSubmitRequest = requestState !== "submitting" && requestMessage.trim().length >= 10;

  const closeRequestModal = useCallback(() => {
    if (requestState === "submitting") return;
    setActiveRequestType(null);
    setActiveRequestMetricId(null);
    setRequestMessage("");
    setRequestState("idle");
  }, [requestState]);

  const openCompanyInfoRequest = (metricId: string) => {
    setActiveRequestType("company_info_change");
    setActiveRequestMetricId(metricId);
    setRequestMessage("");
    setRequestState("idle");
    setRequestFeedback("");
  };

  const openDeactivationRequest = () => {
    setActiveRequestType("account_deactivation");
    setActiveRequestMetricId(null);
    setRequestMessage("");
    setRequestState("idle");
    setRequestFeedback("");
  };

  const submitAccountRequest = async () => {
    if (!activeRequestType || !canSubmitRequest) return;

    setRequestState("submitting");
    setRequestFeedback("");

    const message = activeRequestType === "company_info_change" && activeRequestMetric
      ? [
          `[${activeRequestMetric.label} 변경 요청]`,
          `현재 값: ${activeRequestMetric.value}`,
          "",
          requestMessage.trim(),
        ].join("\n")
      : requestMessage.trim();

    try {
      const response = await fetch("/api/admin/settings/company-account-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: activeRequestType,
          message,
          source: activeRequestType === "company_info_change" ? "admin_settings_account_field" : "admin_settings_account_panel",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "COMPANY_ACCOUNT_REQUEST_CREATE_FAILED");
      }

      setRequestState("submitted");
      setRequestFeedbackTone("success");
      setRequestFeedbackEventKey((currentKey) => currentKey + 1);
      setRequestFeedback(t("settings.accountRequest.submitted", "요청이 접수되었습니다. 시스템관리자 검토 후 처리됩니다."));
      setRequestMessage("");
      setActiveRequestType(null);
      setActiveRequestMetricId(null);
      onRequestSubmitted();
    } catch {
      setRequestState("failed");
      setRequestFeedbackTone("danger");
      setRequestFeedbackEventKey((currentKey) => currentKey + 1);
      setRequestFeedback(t("settings.accountRequest.failed", "요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    }
  };

  const modalTitle = activeRequestType === "account_deactivation"
    ? t("settings.accountRequest.withdrawalTitle", "탈퇴 요청")
    : activeRequestMetric
      ? `${activeRequestMetric.label} ${t("settings.accountRequest.changeRequestSuffix", "변경 요청")}`
      : t("settings.accountRequest.companyInfoButton", "회사 정보 변경 요청");

  return (
    <WaflSectionPanel
      eyebrow={t("settings.account.eyebrow", "회사 계정 정보")}
      title={overview.title}
      description={t("settings.account.redesignedDescription", "회사 정보와 대표 계정 상태를 확인하고, 필요한 변경은 요청으로 접수합니다.")}
      actions={
        <>
          <AdminStatusBadge tone={overview.statusTone}>{overview.statusLabel}</AdminStatusBadge>
          <AdminStatusBadge tone={loadState === "failed" ? "warning" : "neutral"}>
            {loadState === "loading" ? t("common.loadingShort", "조회 중") : t("settings.account.currentData", "현재 계정 기준")}
          </AdminStatusBadge>
        </>
      }
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      <WaflSettingsSectionGroup
        eyebrow={t("settings.account.companyEyebrow", "회사 정보")}
        title={t("settings.account.companyTitle", "회사 기본 정보")}
        description={t("settings.account.companyFieldRequestDescription", "변경이 필요한 항목의 수정 버튼을 눌러 요청을 접수합니다.")}
        badge={<AdminStatusBadge tone={overview.statusTone}>{overview.statusLabel}</AdminStatusBadge>}
        aside={
          deactivationAction ? (
            <AdminButton type="button" size="sm" variant="danger" onClick={openDeactivationRequest}>
              {t("settings.accountRequest.withdrawalButton", "탈퇴 요청")}
            </AdminButton>
          ) : null
        }
        tone="neutral"
      >
        <div className="overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)]">
          {overview.metrics.map((metric) => {
            const editable = editableMetricIds.has(metric.id);
            return (
              <div
                key={metric.id}
                className="grid gap-3 border-b border-[var(--pbp-border)] px-4 py-3 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="text-xs font-bold text-[var(--pbp-text-subtle)]">{metric.label}</div>
                <div className="min-w-0">
                  <div className="break-words text-sm font-bold text-[var(--pbp-text-primary)]">{metric.value}</div>
                  <div className="mt-1 break-words text-xs leading-5 text-[var(--pbp-text-muted)]">{metric.description}</div>
                </div>
                {editable ? (
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openCompanyInfoRequest(metric.id)}
                    className="justify-self-start sm:justify-self-end"
                    aria-label={`${metric.label} 변경 요청`}
                  >
                    {t("settings.accountRequest.fieldEditButton", "수정 요청")}
                  </AdminButton>
                ) : null}
              </div>
            );
          })}
        </div>
      </WaflSettingsSectionGroup>

      <AdminCompanyFilesPanel />

      <ToastMessage message={requestFeedback || null} tone={requestFeedbackTone} eventKey={requestFeedbackEventKey} />

      <WaflSettingsSectionGroup
        eyebrow={t("settings.accountRequest.historyEyebrow", "요청 이력")}
        title={t("settings.accountRequest.historyTitle", "요청 이력과 처리 결과")}
        description={t("settings.accountRequest.historyDescription", "회사 정보 변경과 탈퇴 요청의 접수 상태와 처리 결과를 확인합니다.")}
        badge={
          <AdminStatusBadge tone={requestsLoadState === "failed" ? "warning" : "neutral"} size="xs">
            {requestsLoadState === "loading" ? t("common.loadingShort", "조회 중") : t("settings.accountRequest.historyBadge", "최근 5건")}
          </AdminStatusBadge>
        }
        tone="neutral"
      >
        {requestsLoadState === "failed" ? (
          <WaflSettingCard
            title={t("settings.accountRequest.historyFailedTitle", "요청 이력을 불러오지 못했습니다.")}
            description={t("settings.accountRequest.historyFailedDescription", "요청 접수 기능은 계속 사용할 수 있습니다. 이력은 잠시 후 다시 확인해 주세요.")}
            tone="warning"
            density="compact"
          />
        ) : requests.length > 0 ? (
          <div className="grid gap-3">
            {requests.map((request) => (
              <WaflSettingCard
                key={request.id}
                eyebrow={resolveRequestTypeLabel(request.requestType, t)}
                title={request.requestType === "account_deactivation" ? t("settings.accountRequest.withdrawalButton", "탈퇴 요청") : request.requestTitle}
                description={request.requestMessage}
                badge={<AdminStatusBadge tone={requestStatusTone[request.requestStatus]} size="xs">{resolveRequestStatusLabel(request.requestStatus, t)}</AdminStatusBadge>}
                meta={formatSettingsRequestDate(request.createdAt)}
                footer={
                  <div className="grid gap-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                    <span>{t("settings.accountRequest.reviewerLabel", "검토자")}: {request.reviewerName?.trim() || "-"}</span>
                    <span>{t("settings.accountRequest.reviewedAtLabel", "검토일")}: {request.reviewedAt ? formatSettingsRequestDate(request.reviewedAt) : "-"}</span>
                    {request.reviewMessage?.trim() ? (
                      <span>{t("settings.accountRequest.reviewMessageLabel", "검토 메모")}: {request.reviewMessage}</span>
                    ) : null}
                  </div>
                }
                tone={request.requestStatus === "rejected" ? "danger" : request.requestStatus === "approved" ? "success" : "info"}
                density="compact"
              />
            ))}
          </div>
        ) : (
          <WaflSettingCard
            title={t("settings.accountRequest.historyEmptyTitle", "접수된 요청이 없습니다.")}
            description={t("settings.accountRequest.historyEmptyDescription", "회사 정보 변경 또는 탈퇴가 필요할 때 요청을 작성하면 이곳에 최근 이력이 표시됩니다.")}
            tone="neutral"
            density="compact"
          />
        )}
      </WaflSettingsSectionGroup>

      <AdminModal
        open={Boolean(activeRequestType)}
        title={modalTitle}
        description={
          activeRequestType === "account_deactivation"
            ? t("settings.accountRequest.withdrawalDescription", "탈퇴 요청이 승인되면 서비스 이용이 제한됩니다. 필요한 파일은 미리 내려받아 주세요.")
            : t("settings.accountRequest.fieldModalDescription", "현재 값을 기준으로 변경할 내용과 사유를 적어 요청합니다. 시스템관리자 검토 후 처리됩니다.")
        }
        onClose={closeRequestModal}
        maxWidthClass="md:max-w-2xl"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AdminButton variant="ghost" onClick={closeRequestModal} disabled={requestState === "submitting"}>
              {t("common.cancel", "취소")}
            </AdminButton>
            <AdminButton
              variant={activeRequestType === "account_deactivation" ? "danger" : "primary"}
              onClick={submitAccountRequest}
              disabled={!canSubmitRequest}
            >
              {requestState === "submitting" ? t("common.saving", "저장 중") : t("settings.accountRequest.submit", "요청 접수")}
            </AdminButton>
          </div>
        }
      >
        {activeRequestMetric ? (
          <div className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-3">
            <div className="text-xs font-bold text-[var(--pbp-text-subtle)]">{activeRequestMetric.label}</div>
            <div className="mt-1 break-words text-sm font-black text-[var(--pbp-text-primary)]">{activeRequestMetric.value}</div>
            <div className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{activeRequestMetric.description}</div>
          </div>
        ) : null}
        <label className="grid gap-2">
          <span className="text-xs font-bold text-[var(--pbp-text-subtle)]">
            {activeRequestType === "account_deactivation" ? t("settings.accountRequest.withdrawalReasonLabel", "탈퇴 요청 사유") : t("settings.accountRequest.changeContentLabel", "변경 내용과 사유")}
          </span>
          <textarea
            value={requestMessage}
            onChange={(event) => {
              setRequestMessage(event.target.value);
              if (requestState !== "idle") {
                setRequestState("idle");
                setRequestFeedback("");
              }
            }}
            rows={6}
            className="min-h-36 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm leading-6 text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]/20"
            placeholder={
              activeRequestType === "account_deactivation"
                ? t("settings.accountRequest.withdrawalPlaceholder", "예: 서비스 이용을 중단하려고 합니다. 필요한 자료를 내려받은 뒤 탈퇴 처리를 요청합니다.")
                : t("settings.accountRequest.fieldPlaceholder", "예: 새 회사명은 WAFL Sample Co. 입니다. 사업자등록증과 동일하게 변경 요청합니다.")
            }
          />
        </label>
        <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">
          {t("settings.accountRequest.validation", "10자 이상 입력해야 요청할 수 있습니다. 즉시 변경되지 않고 검토 요청으로 접수됩니다.")}
        </p>
      </AdminModal>
    </WaflSectionPanel>
  );
}


function MarkdownDocumentBody({ markdown }: { markdown: string }) {
  const blocks = markdown.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const currentItems = listItems;
    const key = `list-${elements.length}`;
    elements.push(
      <ul key={key} className="list-disc space-y-2 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-6 py-4 text-sm leading-7 text-[var(--pbp-text-muted)]">
        {currentItems.map((item, index) => (
          <li key={`${key}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  blocks.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("---")) {
      flushList();
      elements.push(<hr key={`hr-${index}`} className="border-[var(--pbp-border)]" />);
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h4 key={`h4-${index}`} className="pt-2 text-sm font-black text-[var(--pbp-text-primary)]">{line.slice(4)}</h4>);
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(<h3 key={`h3-${index}`} className="pt-4 text-base font-black text-[var(--pbp-text-primary)]">{line.slice(3)}</h3>);
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(<h2 key={`h2-${index}`} className="text-lg font-black text-[var(--pbp-text-primary)]">{line.slice(2)}</h2>);
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }

    flushList();
    elements.push(<p key={`p-${index}`} className="text-sm leading-7 text-[var(--pbp-text-muted)]">{line}</p>);
  });

  flushList();

  return <div className="space-y-4">{elements}</div>;
}

function SettingsNoticePanel({ noticeId }: { noticeId: "legal" }) {
  const t = useAdminTranslation();
  const notice = ADMIN_SETTINGS_NOTICE_BY_ID[noticeId];
  const [selectedDocument, setSelectedDocument] = useState<CustomerPolicyDocument | null>(null);
  const [selectedDocumentContent, setSelectedDocumentContent] = useState<CustomerPolicyMarkdownDocument | null>(null);
  const [selectedDocumentLoadState, setSelectedDocumentLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const requiredPolicyCount = getRequiredPolicyDocumentCount();

  const closeDocumentModal = useCallback(() => {
    setSelectedDocument(null);
    setSelectedDocumentContent(null);
    setSelectedDocumentLoadState("idle");
  }, []);

  const openDocumentModal = useCallback(async (document: CustomerPolicyDocument) => {
    setSelectedDocument(document);
    setSelectedDocumentContent(null);
    setSelectedDocumentLoadState("loading");

    try {
      const response = await fetch(`/api/policies/customer-documents/${encodeURIComponent(document.id)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as CustomerPolicyMarkdownPayload;
      if (!response.ok || !payload.ok || !payload.document) {
        throw new Error(payload.error ?? "POLICY_MARKDOWN_READ_FAILED");
      }
      setSelectedDocumentContent(payload.document);
      setSelectedDocumentLoadState("loaded");
    } catch (error) {
      console.error("[settings] failed to load customer policy markdown", error);
      setSelectedDocumentLoadState("failed");
    }
  }, []);

  return (
    <>
      <WaflSectionPanel
        eyebrow={t("settings.notice.eyebrow", "약관·정책")}
        title={t("settings.notice.redesignedTitle", "약관·정책")}
        description={t("settings.notice.redesignedDescription", "필수 약관과 운영정책을 이 화면에서 바로 확인합니다. 각 문서를 누르면 전체 내용을 모달로 열람합니다.")}
        actions={
          <>
            <AdminStatusBadge tone="warning">{t("settings.notice.requiredCount", "필수 동의")} {requiredPolicyCount}{t("common.countUnit", "건")}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">{CUSTOMER_POLICY_DOCUMENTS.length}{t("common.countUnit", "건")}</AdminStatusBadge>
          </>
        }
        className="min-h-[320px]"
        bodyClassName="pt-4 space-y-4"
      >
        <WaflSettingsSectionGroup
          eyebrow={t("settings.notice.documentEyebrow", "문서 목록")}
          title={t("settings.notice.documentListTitle", "고객 공개 약관·정책")}
          description={t("settings.notice.documentListDescription", "문서별 필수 여부와 버전을 확인하고 필요한 문서를 바로 열람합니다.")}
          tone="neutral"
        >
          <div className="overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)]">
            {CUSTOMER_POLICY_DOCUMENTS.map((document) => (
              <div
                key={document.id}
                className="grid gap-3 border-b border-[var(--pbp-border)] px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-[var(--pbp-text-primary)]">{document.title}</h3>
                    <AdminStatusBadge tone={policyCategoryTone[document.category]} size="xs">{document.categoryLabel}</AdminStatusBadge>
                    <AdminStatusBadge tone="neutral" size="xs">{document.versionLabel}</AdminStatusBadge>
                    {document.requiredForApproval ? <AdminStatusBadge tone="warning" size="xs">{t("settings.notice.required", "필수 동의")}</AdminStatusBadge> : null}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">{document.subtitle}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{document.summary}</p>
                </div>
                <div className="flex items-center justify-between gap-3 lg:justify-end">
                  <span className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{document.effectiveDateLabel}</span>
                  <AdminButton type="button" size="sm" variant="secondary" onClick={() => void openDocumentModal(document)}>
                    {t("settings.notice.openDocument", "보기")}
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </WaflSettingsSectionGroup>

        <WaflSettingsSectionGroup
          eyebrow={t("settings.notice.agreementEyebrow", "동의 상태")}
          title={t("settings.notice.agreementTitle", "필수 약관 동의 상태")}
          description={t("settings.notice.agreementDescription", "중요 정책 변경이나 재동의 필요 상태는 업무 접근 차단 화면과 약관·정책 화면에서 함께 안내됩니다.")}
          badge={<AdminStatusBadge tone="warning" size="xs">{t("settings.notice.required", "필수 동의")}</AdminStatusBadge>}
          tone="warning"
        >
          <div className="grid gap-2 text-sm leading-6 text-[var(--pbp-text-muted)] sm:grid-cols-2">
            <p>{t("settings.notice.requiredPolicySummary", "필수 문서는 이용약관, 개인정보처리방침, 요금·환불정책, 데이터 보관·삭제정책입니다.")}</p>
            <p>{t("settings.notice.reagreementSummary", "재동의가 필요한 경우 이 탭에서 문서를 열람한 뒤 약관·정책 화면에서 동의 상태를 갱신합니다.")}</p>
          </div>
        </WaflSettingsSectionGroup>
      </WaflSectionPanel>

      <AdminModal
        open={Boolean(selectedDocument)}
        title={selectedDocument?.title ?? t("settings.notice.documentModalTitle", "약관 문서")}
        description={selectedDocument ? `${selectedDocument.subtitle} · ${selectedDocument.versionLabel}` : undefined}
        onClose={closeDocumentModal}
        maxWidthClass="md:max-w-4xl"
        bodyClassName="space-y-4 [scrollbar-gutter:stable]"
        footer={
          <div className="flex w-full justify-end">
            <AdminButton type="button" variant="primary" onClick={closeDocumentModal}>
              {t("common.close", "닫기")}
            </AdminButton>
          </div>
        }
      >
        {selectedDocument ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <AdminStatusBadge tone={policyCategoryTone[selectedDocument.category]}>{selectedDocument.categoryLabel}</AdminStatusBadge>
                <AdminStatusBadge tone="neutral">{selectedDocument.versionLabel}</AdminStatusBadge>
                <AdminStatusBadge tone={selectedDocument.requiredForApproval ? "warning" : "neutral"}>
                  {selectedDocument.requiredForApproval ? t("settings.notice.required", "필수 동의") : t("settings.notice.optional", "선택 문서")}
                </AdminStatusBadge>
                <AdminStatusBadge tone="neutral">{selectedDocument.effectiveDateLabel}</AdminStatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--pbp-text-muted)]">{selectedDocument.summary}</p>
            </div>

            {selectedDocument.sourceNote ? (
              <p className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
                {selectedDocument.sourceNote}
              </p>
            ) : null}

            {selectedDocumentLoadState === "loading" ? (
              <WaflSettingCard
                title={t("settings.notice.documentLoadingTitle", "문서를 불러오고 있습니다.")}
                description={t("settings.notice.documentLoadingDescription", "고객 공개 Markdown 원문을 읽어오는 중입니다.")}
                tone="neutral"
                density="compact"
              />
            ) : null}

            {selectedDocumentLoadState === "failed" ? (
              <WaflSettingCard
                title={t("settings.notice.documentFailedTitle", "문서를 불러오지 못했습니다.")}
                description={t("settings.notice.documentFailedDescription", "정책 문서 원문을 읽을 수 없습니다. 문서 파일 위치를 확인해 주세요.")}
                tone="warning"
                density="compact"
              />
            ) : null}

            {selectedDocumentLoadState === "loaded" && selectedDocumentContent ? (
              <article className="max-h-[60vh] overflow-auto rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-6 [scrollbar-gutter:stable]">
                <div className="mb-5 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-3 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
                  원문 파일: {selectedDocumentContent.sourceFileName}
                </div>
                <MarkdownDocumentBody markdown={selectedDocumentContent.markdown} />
              </article>
            ) : null}
          </div>
        ) : null}
      </AdminModal>
    </>
  );
}

function FeedbackPanel() {
  const t = useAdminTranslation();
  const feedback = ADMIN_SETTINGS_NOTICE_BY_ID.feedback;
  const [feedbackType, setFeedbackType] = useState<CompanyFeedbackType>("feature");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRequests, setFeedbackRequests] = useState<CompanyFeedbackRequestRecord[]>([]);
  const [feedbackLoadState, setFeedbackLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [feedbackSubmitState, setFeedbackSubmitState] = useState<"idle" | "submitting" | "submitted" | "failed">("idle");
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [feedbackNoticeTone, setFeedbackNoticeTone] = useState<ToastTone>("info");
  const [feedbackNoticeEventKey, setFeedbackNoticeEventKey] = useState(0);

  const feedbackTypeOptions = useMemo(
    () => [
      { value: "feature" as const, label: t("settings.feedback.type.feature", "기능 건의") },
      { value: "bug" as const, label: t("settings.feedback.type.bug", "오류 제보") },
      { value: "improvement" as const, label: t("settings.feedback.type.improvement", "개선 요청") },
    ],
    [t],
  );

  const feedbackStatusLabels: Record<CompanyFeedbackStatus, string> = useMemo(
    () => ({
      received: t("settings.feedback.status.received", "접수됨"),
      reviewing: t("settings.feedback.status.reviewing", "검토중"),
      answered: t("settings.feedback.status.answered", "답변완료"),
      closed: t("settings.feedback.status.closed", "종료"),
    }),
    [t],
  );

  const feedbackStatusTones: Record<CompanyFeedbackStatus, AdminStatusBadgeTone> = {
    received: "info",
    reviewing: "warning",
    answered: "success",
    closed: "neutral",
  };

  const normalizedTitle = feedbackTitle.trim();
  const normalizedMessage = feedbackMessage.trim();
  const canSubmitFeedback = normalizedTitle.length >= 2 && normalizedMessage.length >= 10 && feedbackSubmitState !== "submitting";

  const refreshFeedbackRequests = useCallback(() => {
    setFeedbackLoadState("loading");
    fetch("/api/admin/settings/feedback", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as CompanyFeedbackPayload | null;
        if (!response.ok || !payload?.ok || !Array.isArray(payload.requests)) {
          throw new Error("COMPANY_FEEDBACK_LIST_FAILED");
        }
        setFeedbackRequests(payload.requests);
        setFeedbackLoadState("loaded");
      })
      .catch(() => {
        setFeedbackRequests([]);
        setFeedbackLoadState("failed");
      });
  }, []);

  useEffect(() => {
    refreshFeedbackRequests();
  }, [refreshFeedbackRequests]);

  const submitFeedback = useCallback(async () => {
    if (!canSubmitFeedback) return;
    setFeedbackSubmitState("submitting");
    setFeedbackNotice("");

    try {
      const response = await fetch("/api/admin/settings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          title: normalizedTitle,
          message: normalizedMessage,
          source: "admin_settings",
        }),
      });
      const payload = (await response.json().catch(() => null)) as CompanyFeedbackPayload | null;
      if (!response.ok || !payload?.ok || !payload.feedback) {
        throw new Error("COMPANY_FEEDBACK_CREATE_FAILED");
      }

      setFeedbackTitle("");
      setFeedbackMessage("");
      setFeedbackType("feature");
      setFeedbackSubmitState("submitted");
      setFeedbackNoticeTone("success");
      setFeedbackNotice(t("settings.feedback.submitSuccess", "문의가 접수되었습니다."));
      setFeedbackNoticeEventKey((key) => key + 1);
      refreshFeedbackRequests();
    } catch {
      setFeedbackSubmitState("failed");
      setFeedbackNoticeTone("danger");
      setFeedbackNotice(t("settings.feedback.submitFailed", "문의를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."));
      setFeedbackNoticeEventKey((key) => key + 1);
    }
  }, [canSubmitFeedback, feedbackType, normalizedMessage, normalizedTitle, refreshFeedbackRequests, t]);

  return (
    <WaflSectionPanel
      eyebrow={t("settings.feedback.eyebrow", "서비스 건의")}
      title={feedback.title}
      description={t("settings.feedback.dbDescription", "기능 건의, 오류 제보, 개선 요청을 접수하고 처리 상태를 확인합니다.")}
      actions={<AdminStatusBadge tone="info">{t("settings.feedback.dbMode", "문의 접수")}</AdminStatusBadge>}
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <WaflSettingsSectionGroup
          eyebrow={t("settings.feedback.formEyebrow", "문의 내용")}
          title={t("settings.feedback.formTitle", "문의하기")}
          description={t("settings.feedback.formDescriptionDb", "운영팀에 전달할 내용을 작성하면 접수 이력에 저장됩니다.")}
          tone="neutral"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--pbp-text-subtle)]" htmlFor="admin-feedback-type">
                {t("settings.feedback.typeLabel", "문의 유형")}
              </label>
              <select
                id="admin-feedback-type"
                value={feedbackType}
                onChange={(event) => setFeedbackType(event.target.value as CompanyFeedbackType)}
                className="mt-2 h-11 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]/20"
              >
                {feedbackTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--pbp-text-subtle)]" htmlFor="admin-feedback-title">
                {t("settings.feedback.titleLabel", "제목")}
              </label>
              <input
                id="admin-feedback-title"
                value={feedbackTitle}
                onChange={(event) => {
                  setFeedbackTitle(event.target.value);
                  if (feedbackSubmitState !== "idle") setFeedbackSubmitState("idle");
                }}
                className="mt-2 h-11 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]/20"
                placeholder={t("settings.feedback.titlePlaceholder", "예: 사업자등록증 업로드 후 검토 상태가 궁금합니다")}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--pbp-text-subtle)]" htmlFor="admin-feedback-message">
                {t("settings.feedback.messageLabel", "내용")}
              </label>
              <textarea
                id="admin-feedback-message"
                value={feedbackMessage}
                onChange={(event) => {
                  setFeedbackMessage(event.target.value);
                  if (feedbackSubmitState !== "idle") setFeedbackSubmitState("idle");
                }}
                rows={7}
                className="mt-2 min-h-40 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm leading-6 text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]/20"
                placeholder={t("settings.feedback.messagePlaceholder", "불편한 상황, 재현 방법, 원하는 개선 방향을 적어 주세요.")}
              />
              <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                {t("settings.feedback.validationHintDb", "제목 2자 이상, 내용 10자 이상 입력하면 문의할 수 있습니다.")}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => {
                  setFeedbackTitle("");
                  setFeedbackMessage("");
                  setFeedbackType("feature");
                  setFeedbackSubmitState("idle");
                }}
                disabled={feedbackSubmitState === "submitting"}
              >
                {t("common.reset", "초기화")}
              </AdminButton>
              <AdminButton variant="primary" onClick={submitFeedback} disabled={!canSubmitFeedback}>
                {feedbackSubmitState === "submitting" ? t("common.saving", "저장 중") : t("settings.feedback.submit", "문의하기")}
              </AdminButton>
            </div>
          </div>
        </WaflSettingsSectionGroup>

        <WaflSettingsSectionGroup
          eyebrow={t("settings.feedback.historyEyebrow", "접수 이력")}
          title={t("settings.feedback.historyTitle", "최근 접수 이력")}
          description={t("settings.feedback.historyDescriptionDb", "최근 접수한 문의의 처리 상태와 답변을 확인합니다.")}
          badge={<AdminStatusBadge tone={feedbackLoadState === "failed" ? "warning" : "neutral"}>{feedbackLoadState === "loading" ? t("common.loadingShort", "조회 중") : t("settings.feedback.historyBadge", "최근 5건")}</AdminStatusBadge>}
          tone="neutral"
        >
          {feedbackLoadState === "failed" ? (
            <div className="rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-6 text-sm leading-6 text-[var(--pbp-text-muted)]">
              <p className="font-semibold text-[var(--pbp-text-primary)]">{t("settings.feedback.historyFailedTitle", "접수 이력을 불러오지 못했습니다.")}</p>
              <p className="mt-2">{t("settings.feedback.historyFailedDescription", "문의 접수는 계속 사용할 수 있습니다. 이력은 잠시 후 다시 확인해 주세요.")}</p>
            </div>
          ) : feedbackRequests.length > 0 ? (
            <div className="space-y-3">
              {feedbackRequests.map((request) => {
                const typeLabel = feedbackTypeOptions.find((option) => option.value === request.feedbackType)?.label ?? request.feedbackType;
                return (
                  <div key={request.id} className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[var(--pbp-text-primary)]">{request.title}</p>
                        <p className="mt-1 text-xs text-[var(--pbp-text-muted)]">{typeLabel} · {formatDateTime(request.createdAt)}</p>
                      </div>
                      <AdminStatusBadge tone={feedbackStatusTones[request.feedbackStatus] ?? "neutral"} size="xs">
                        {feedbackStatusLabels[request.feedbackStatus] ?? request.feedbackStatus}
                      </AdminStatusBadge>
                    </div>
                    {request.responseMessage ? <p className="mt-3 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{request.responseMessage}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-6 text-sm leading-6 text-[var(--pbp-text-muted)]">
              <p className="font-semibold text-[var(--pbp-text-primary)]">{t("settings.feedback.emptyHistoryTitle", "아직 접수된 문의가 없습니다.")}</p>
              <p className="mt-2">{t("settings.feedback.emptyHistoryDescriptionDb", "문의가 접수되면 이 영역에 처리 상태가 표시됩니다.")}</p>
            </div>
          )}
        </WaflSettingsSectionGroup>
      </div>
      <ToastMessage message={feedbackNotice || null} tone={feedbackNoticeTone} eventKey={feedbackNoticeEventKey} />
    </WaflSectionPanel>
  );
}

export default function AdminSettingsHub() {
  const t = useAdminTranslation();
  const [activeMenuId, setActiveMenuId] = useState<AdminSettingsMenuId>("account");
  const [billingPlanOverview, setBillingPlanOverview] = useState<AdminBillingPlanOverview | null>(null);
  const [companySubscription, setCompanySubscription] = useState<CompanySubscriptionSnapshot | null>(null);
  const [accountOverview, setAccountOverview] = useState<AdminAccountSettingsOverview | null>(null);
  const [accountRequests, setAccountRequests] = useState<CompanyAccountRequestRecord[]>([]);
  const [billingPlanLoadState, setBillingPlanLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [subscriptionLoadState, setSubscriptionLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [accountLoadState, setAccountLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [accountRequestsLoadState, setAccountRequestsLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");

  const refreshAccountRequests = useCallback(() => {
    setAccountRequestsLoadState("loading");

    fetch("/api/admin/settings/company-account-requests", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as CompanyAccountRequestsPayload | null;

        if (!response.ok || !payload?.ok || !Array.isArray(payload.requests)) {
          throw new Error("COMPANY_ACCOUNT_REQUEST_LIST_FAILED");
        }

        setAccountRequests(payload.requests);
        setAccountRequestsLoadState("loaded");
      })
      .catch(() => {
        setAccountRequests([]);
        setAccountRequestsLoadState("failed");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBillingPlanLoadState("loading");
    setSubscriptionLoadState("loading");
    setAccountLoadState("loading");

    fetch("/api/admin/companies/current", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as AdminCurrentCompanyPayload | null;
        if (cancelled) return;

        if (payload?.billing) {
          setBillingPlanOverview(payload.billing);
          setBillingPlanLoadState("loaded");
        } else {
          setBillingPlanLoadState("failed");
        }

        if (payload?.account) {
          setAccountOverview(payload.account);
          setAccountLoadState("loaded");
        } else {
          setAccountLoadState("failed");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBillingPlanLoadState("failed");
          setAccountLoadState("failed");
        }
      });

    fetch("/api/admin/subscription", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as CompanySubscriptionPayload | null;
        if (cancelled) return;

        if (!response.ok || !payload?.ok || !payload.subscription) {
          throw new Error("ADMIN_COMPANY_SUBSCRIPTION_LOAD_FAILED");
        }

        setCompanySubscription(payload.subscription);
        setSubscriptionLoadState("loaded");
      })
      .catch(() => {
        if (!cancelled) {
          setCompanySubscription(null);
          setSubscriptionLoadState("failed");
        }
      });

    refreshAccountRequests();

    return () => {
      cancelled = true;
    };
  }, [refreshAccountRequests]);

  const renderActiveSettingsPanel = () => {
    if (activeMenuId === "standards") {
      return <AdminStandardsSection mode="standards-only" />;
    }

    if (activeMenuId === "billing") {
      if (!billingPlanOverview) {
        return (
          <AdminEmptyState
            title={t("settings.billing.emptyTitle", "요금제 정보를 불러오지 못했습니다.")}
            description={t("settings.billing.emptyDescription", "현재 로그인 회사 기준의 설정 데이터가 없거나 조회 권한이 없습니다.")}
          />
        );
      }

      return <BillingPlanPanel overview={billingPlanOverview} loadState={billingPlanLoadState} subscription={companySubscription} subscriptionLoadState={subscriptionLoadState} />;
    }

    if (activeMenuId === "account") {
      if (!accountOverview) {
        return (
          <AdminEmptyState
            title={t("settings.account.emptyTitle", "계정 정보를 불러오지 못했습니다.")}
            description={t("settings.account.emptyDescription", "현재 로그인 회사와 관리자 계정 기준의 설정 데이터를 확인할 수 없습니다.")}
          />
        );
      }

      return (
        <AccountSettingsPanel
          overview={accountOverview}
          loadState={accountLoadState}
          requests={accountRequests}
          requestsLoadState={accountRequestsLoadState}
          onRequestSubmitted={refreshAccountRequests}
        />
      );
    }

    if (activeMenuId === "legal") {
      return <SettingsNoticePanel noticeId="legal" />;
    }

    if (activeMenuId === "feedback") {
      return <FeedbackPanel />;
    }

    return <AdminEmptyState title={t("common.preparing", "준비중입니다.")} />;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-0 sm:pr-1">
      <WaflPageHero
        eyebrow={t("settings.hub.eyebrow", "고객사 환경설정")}
        title={t("settings.hub.title", "환경설정")}
        description={t("settings.hub.description", "회사 정보와 운영 기준을 필요한 항목별로 관리합니다.")}
      >
        <WaflSettingsTabs
          items={ADMIN_SETTINGS_MENU_ITEMS.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.detailItems.slice(0, 2).join(" · "),
            tone: settingsMenuToneMap[item.tone] ?? "brand",
          }))}
          activeId={activeMenuId}
          onChange={(id) => setActiveMenuId(id as AdminSettingsMenuId)}
          ariaLabel={t("settings.hub.tabsAria", "환경설정 메뉴")}
        />
      </WaflPageHero>

      <section className="flex min-h-0 flex-1 flex-col">
        {renderActiveSettingsPanel()}
      </section>
    </div>
  );
}
