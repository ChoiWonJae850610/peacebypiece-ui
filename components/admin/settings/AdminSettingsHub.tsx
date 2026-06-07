"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import WaflSettingCard from "@/components/admin/common/WaflSettingCard";
import WaflSettingsSectionGroup from "@/components/admin/common/WaflSettingsSectionGroup";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import {
  ADMIN_SETTINGS_MENU_ITEMS,
  ADMIN_SETTINGS_NOTICE_BY_ID,
  type AdminSettingsMenuId,
  type AdminSettingsMenuItem,
  type AdminSettingsMenuTone,
} from "@/lib/admin/settings/adminSettingsHub";
import { ADMIN_FEEDBACK_CONTACT_EMAIL, buildAdminFeedbackMailtoHref } from "@/lib/admin/settings/adminFeedbackContact";
import { type AdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";
import { formatStorageBytes } from "@/lib/billing/storageQuotaPolicy";
import { formatPbpNumberWithUnit } from "@/lib/utils/formatters";
import { type AdminAccountSettingsOverview } from "@/lib/admin/settings/adminAccountSettingsOverview";
import AdminCompanyFilesPanel from "@/components/admin/settings/AdminCompanyFilesPanel";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

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

const toneClassNames: Record<AdminSettingsMenuTone, { badgeTone: AdminStatusBadgeTone; dot: string; activeRing: string }> = {
  blue: {
    badgeTone: "info",
    dot: "bg-[var(--pbp-status-neutral-bg)]",
    activeRing: "border-[var(--pbp-border-strong)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-text)] shadow-sm",
  },
  amber: {
    badgeTone: "warning",
    dot: "bg-[var(--pbp-status-warning)]",
    activeRing: "border-[var(--pbp-border-strong)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-text)] shadow-sm",
  },
  emerald: {
    badgeTone: "success",
    dot: "bg-[var(--pbp-status-success)]",
    activeRing: "border-[var(--pbp-border-strong)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-text)] shadow-sm",
  },
  violet: {
    badgeTone: "maintenance",
    dot: "bg-[var(--pbp-accent)]",
    activeRing: "border-[var(--pbp-accent-border)] bg-[var(--pbp-accent-soft)] text-[var(--pbp-text)] shadow-sm",
  },
};

function SettingsMenuTab({ item, active, onClick }: { item: AdminSettingsMenuItem; active: boolean; onClick: () => void }) {
  const tone = toneClassNames[item.tone];
  const summary = item.detailItems.slice(0, 2).join(" · ");

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[68px] w-full flex-col rounded-2xl border px-4 py-3 text-left transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-soft)] ${
        active
          ? tone.activeRing
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)]"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--pbp-text)]">
        <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />
        {item.title}
      </span>
      <span className="mt-2 line-clamp-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{summary}</span>
    </button>
  );
}


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
  const [requestMessage, setRequestMessage] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "submitting" | "submitted" | "failed">("idle");
  const [requestFeedback, setRequestFeedback] = useState("");
  const [requestFeedbackTone, setRequestFeedbackTone] = useState<ToastTone>("info");
  const [requestFeedbackEventKey, setRequestFeedbackEventKey] = useState(0);

  const activeRequestAction = overview.actions.find((action) => action.requestType === activeRequestType) ?? null;
  const companyInfoAction = overview.actions.find((action) => action.requestType === "company_info_change") ?? null;
  const deactivationAction = overview.actions.find((action) => action.requestType === "account_deactivation") ?? null;
  const canSubmitRequest = requestState !== "submitting" && requestMessage.trim().length >= 10;

  const openRequestComposer = (requestType: "company_info_change" | "account_deactivation") => {
    setActiveRequestType(requestType);
    setRequestState("idle");
    setRequestFeedback("");
  };

  const submitAccountRequest = async () => {
    if (!activeRequestType || !canSubmitRequest) return;

    setRequestState("submitting");
    setRequestFeedback("");

    try {
      const response = await fetch("/api/admin/settings/company-account-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: activeRequestType,
          message: requestMessage,
          source: "admin_settings_account_panel",
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
      onRequestSubmitted();
    } catch {
      setRequestState("failed");
      setRequestFeedbackTone("danger");
      setRequestFeedbackEventKey((currentKey) => currentKey + 1);
      setRequestFeedback(t("settings.accountRequest.failed", "요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    }
  };

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
        description={t("settings.account.companyRedesignedDescription", "현재 등록된 회사 정보입니다. 회사명, 사업자 정보, 주소 변경은 요청으로 접수합니다.")}
        badge={<AdminStatusBadge tone={overview.statusTone}>{overview.statusLabel}</AdminStatusBadge>}
        aside={
          <>
            {companyInfoAction ? (
              <AdminButton type="button" size="sm" variant="secondary" onClick={() => openRequestComposer("company_info_change")}>
                {t("settings.accountRequest.companyInfoButton", "회사 정보 변경 요청")}
              </AdminButton>
            ) : null}
            {deactivationAction ? (
              <AdminButton type="button" size="sm" variant="danger" onClick={() => openRequestComposer("account_deactivation")}>
                {t("settings.accountRequest.withdrawalButton", "탈퇴 요청")}
              </AdminButton>
            ) : null}
          </>
        }
        tone="neutral"
      >
        <div className="overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)]">
          {overview.metrics.map((metric) => (
            <div
              key={metric.id}
              className="grid gap-1 border-b border-[var(--pbp-border)] px-4 py-3 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 sm:px-5"
            >
              <div className="text-xs font-bold text-[var(--pbp-text-subtle)]">{metric.label}</div>
              <div className="min-w-0">
                <div className="break-words text-sm font-bold text-[var(--pbp-text-primary)]">{metric.value}</div>
                <div className="mt-1 break-words text-xs leading-5 text-[var(--pbp-text-muted)]">{metric.description}</div>
              </div>
            </div>
          ))}
        </div>
      </WaflSettingsSectionGroup>

      <AdminCompanyFilesPanel />

      {activeRequestAction ? (
        <WaflSettingsSectionGroup
          eyebrow={t("settings.accountRequest.eyebrow", "요청 작성")}
          title={activeRequestType === "account_deactivation" ? t("settings.accountRequest.withdrawalTitle", "탈퇴 요청") : activeRequestAction.label}
          description={
            activeRequestType === "account_deactivation"
              ? t("settings.accountRequest.withdrawalDescription", "탈퇴 요청이 승인되면 서비스 이용이 제한됩니다. 필요한 파일은 미리 내려받아 주세요.")
              : t("settings.accountRequest.description", "변경하려는 내용과 사유를 적으면 시스템관리자가 검토할 수 있는 요청으로 접수됩니다.")
          }
          badge={<AdminStatusBadge tone={activeRequestType === "account_deactivation" ? "warning" : activeRequestAction.tone} size="xs">{activeRequestAction.statusLabel}</AdminStatusBadge>}
          tone={activeRequestType === "account_deactivation" ? "danger" : "warning"}
          footer={t("settings.accountRequest.validation", "10자 이상 입력해야 요청할 수 있습니다. 즉시 변경되지 않고 검토 요청으로 접수됩니다.")}
        >
          <textarea
            value={requestMessage}
            onChange={(event) => {
              setRequestMessage(event.target.value);
              if (requestState !== "idle") {
                setRequestState("idle");
                setRequestFeedback("");
              }
            }}
            rows={4}
            className="min-h-28 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm leading-6 text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]/20"
            placeholder={
              activeRequestType === "account_deactivation"
                ? t("settings.accountRequest.withdrawalPlaceholder", "예: 서비스 이용을 중단하려고 합니다. 필요한 자료를 내려받은 뒤 탈퇴 처리를 요청합니다.")
                : t("settings.accountRequest.placeholder", "예: 사업자명이 변경되었습니다. 변경 전/후 정보와 사유를 입력해 주세요.")
            }
          />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <AdminButton
              variant="ghost"
              onClick={() => {
                setActiveRequestType(null);
                setRequestMessage("");
                setRequestState("idle");
                setRequestFeedback("");
              }}
              disabled={requestState === "submitting"}
            >
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
        </WaflSettingsSectionGroup>
      ) : null}

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
    </WaflSectionPanel>
  );
}

function SettingsNoticePanel({ noticeId }: { noticeId: "legal" }) {
  const t = useAdminTranslation();
  const notice = ADMIN_SETTINGS_NOTICE_BY_ID[noticeId];

  return (
    <WaflSectionPanel
      eyebrow={t("settings.notice.eyebrow", "약관·정책")}
      title={notice.title}
      description={notice.description}
      actions={<AdminLinkButton variant="primary" href="/workspace/legal">{t("settings.notice.openLegal", "약관·정책 보기")}</AdminLinkButton>}
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <WaflSettingsSectionGroup
          eyebrow={t("settings.notice.documentEyebrow", "고객 공개 문서")}
          title={t("settings.notice.documentTitle", "조회 대상 문서")}
          description={t("settings.notice.documentDescription", "고객사가 환경설정에서 확인하게 될 약관·정책 문서 목록입니다.")}
          tone="neutral"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {notice.items.map((item) => (
              <WaflSettingCard key={item} title={item} tone="neutral" density="compact" />
            ))}
          </div>
        </WaflSettingsSectionGroup>
        <WaflSettingsSectionGroup
          eyebrow={t("settings.notice.nextStepTitle", "적용 예정")}
          title={notice.nextStep}
          description={t("settings.notice.nextStepDescription", "현재 공개된 정책 문서를 확인하고, 후속 단계에서 정책 버전과 동의 이력을 연결합니다.")}
          tone="info"
        >
          <WaflSettingCard title={t("settings.notice.openLegal", "약관·정책 보기")} description={notice.description} tone="info" density="compact" actions={<AdminLinkButton variant="secondary" href="/workspace/legal">{t("settings.notice.openLegal", "약관·정책 보기")}</AdminLinkButton>} />
        </WaflSettingsSectionGroup>
      </div>
    </WaflSectionPanel>
  );
}

function FeedbackPanel() {
  const t = useAdminTranslation();
  const feedback = ADMIN_SETTINGS_NOTICE_BY_ID.feedback;
  const feedbackMailtoHref = useMemo(() => buildAdminFeedbackMailtoHref(), []);
  return (
    <WaflSectionPanel
      eyebrow={t("settings.feedback.eyebrow", "서비스 건의")}
      title={feedback.title}
      description={feedback.description}
      actions={
        <AdminLinkButton variant="primary" href={feedbackMailtoHref}>
          {t("settings.feedback.writeEmail", "이메일 작성하기")}
        </AdminLinkButton>
      }
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      <WaflSettingsSectionGroup
        eyebrow={t("settings.feedback.emailLabel", "접수 이메일")}
        title={<span className="font-mono">{ADMIN_FEEDBACK_CONTACT_EMAIL}</span>}
        description={t("settings.feedback.mailDescription", "개선 요청, 오류 제보, 기능 제안 내용을 이메일로 작성해 전달합니다.")}
        tone="info"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {feedback.items.map((item) => (
              <WaflSettingCard key={item} title={item} tone="neutral" density="compact" />
            ))}
          </div>
          <WaflSettingCard
            eyebrow={t("settings.notice.nextStepTitle", "적용 예정")}
            title={feedback.nextStep}
            tone="info"
            density="compact"
          />
        </div>
      </WaflSettingsSectionGroup>
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
        <div className="rounded-[1.5rem] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-2">
          <div className="grid gap-2 md:grid-cols-5">
            {ADMIN_SETTINGS_MENU_ITEMS.map((item) => (
              <SettingsMenuTab key={item.id} item={item} active={activeMenuId === item.id} onClick={() => setActiveMenuId(item.id)} />
            ))}
          </div>
        </div>
      </WaflPageHero>

      <section className="flex min-h-0 flex-1 flex-col">
        {renderActiveSettingsPanel()}
      </section>
    </div>
  );
}
