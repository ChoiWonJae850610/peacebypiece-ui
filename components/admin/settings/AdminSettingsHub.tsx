"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { ADMIN_SURFACE_ITEM_CLASS, ADMIN_SURFACE_SUBTLE_BOX_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminSection } from "@/components/admin/common/AdminSection";
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
import { type AdminAccountSettingsOverview } from "@/lib/admin/settings/adminAccountSettingsOverview";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminCurrentCompanyPayload = {
  ok?: boolean;
  billing?: AdminBillingPlanOverview;
  account?: AdminAccountSettingsOverview;
};

const toneClassNames: Record<AdminSettingsMenuTone, { card: string; badgeTone: AdminStatusBadgeTone; dot: string }> = {
  blue: {
    card: "pbp-admin-card-interactive",
    badgeTone: "info",
    dot: "bg-[var(--pbp-status-neutral)]",
  },
  amber: {
    card: "pbp-admin-card-interactive",
    badgeTone: "warning",
    dot: "bg-[var(--pbp-status-warning)]",
  },
  emerald: {
    card: "pbp-admin-card-interactive",
    badgeTone: "success",
    dot: "bg-[var(--pbp-status-success)]",
  },
  violet: {
    card: "pbp-admin-card-interactive",
    badgeTone: "maintenance",
    dot: "bg-[var(--pbp-accent)]",
  },
};

function SettingsMenuCard({ item, active, onClick }: { item: AdminSettingsMenuItem; active: boolean; onClick: () => void }) {
  const tone = toneClassNames[item.tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[112px] w-full min-w-0 flex-col justify-between rounded-[22px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 sm:min-h-[118px] ${tone.card} ${
        active ? "ring-2 ring-[var(--pbp-focus-ring)]/20" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <span className="text-base font-semibold pbp-text-primary">{item.title}</span>
          </span>
          <span className="mt-2 block text-xs leading-5 pbp-text-muted">{item.description}</span>
        </span>
        <AdminStatusBadge tone={tone.badgeTone}>{item.statusLabel}</AdminStatusBadge>
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {item.detailItems.map((detail) => (
          <span key={detail} className="rounded-full px-2 py-0.5 text-[11px] font-semibold pbp-admin-soft-badge">
            {detail}
          </span>
        ))}
      </span>
    </button>
  );
}

function BillingPlanPanel({ overview, loadState }: { overview: AdminBillingPlanOverview; loadState: "idle" | "loading" | "loaded" | "failed" }) {
  const t = useAdminTranslation();
  return (
    <AdminSection
      title={overview.title}
      description={overview.description}
      actions={
        <div className="flex flex-wrap gap-1.5">
          <AdminStatusBadge tone="success">{overview.currentPlanLabel}</AdminStatusBadge>
          <AdminStatusBadge tone="maintenance">{overview.systemManagedLabel}</AdminStatusBadge>
          <AdminStatusBadge tone={loadState === "failed" ? "warning" : "neutral"}>
            {loadState === "loading" ? t("common.loadingShort", "조회 중") : overview.dataSourceLabel}
          </AdminStatusBadge>
        </div>
      }
      className="min-h-[320px]"
      bodyClassName="mt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {overview.metrics.map((metric) => (
            <div key={metric.id} className={ADMIN_SURFACE_SUBTLE_BOX_CLASS}>
              <p className="text-[11px] font-semibold pbp-text-subtle">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-stone-950">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 pbp-text-muted">{metric.description}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {overview.actions.map((action) => (
            <div key={action.id} className={ADMIN_SURFACE_ITEM_CLASS}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold pbp-text-primary">{action.label}</p>
                <AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>
              </div>
              <p className="mt-2 text-xs leading-5 pbp-text-muted">{action.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={`${ADMIN_SURFACE_ITEM_CLASS} grid gap-2 rounded-[22px] md:grid-cols-2`}>
        {overview.policyNotes.map((note) => (
          <p key={note} className="text-xs leading-5 pbp-text-muted">• {note}</p>
        ))}
      </div>
    </AdminSection>
  );
}

function AccountSettingsPanel({ overview, loadState }: { overview: AdminAccountSettingsOverview; loadState: "idle" | "loading" | "loaded" | "failed" }) {
  const t = useAdminTranslation();
  const [activeRequestType, setActiveRequestType] = useState<"company_info_change" | "account_deactivation" | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "submitting" | "submitted" | "failed">("idle");
  const [requestFeedback, setRequestFeedback] = useState("");

  const activeRequestAction = overview.actions.find((action) => action.requestType === activeRequestType) ?? null;
  const canSubmitRequest = requestState !== "submitting" && requestMessage.trim().length >= 10;

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
      setRequestFeedback(t("settings.accountRequest.submitted", "요청이 접수되었습니다. 시스템관리자 검토 후 처리됩니다."));
      setRequestMessage("");
      setActiveRequestType(null);
    } catch {
      setRequestState("failed");
      setRequestFeedback(t("settings.accountRequest.failed", "요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    }
  };

  return (
    <AdminSection
      title={overview.title}
      description={overview.description}
      actions={
        <div className="flex flex-wrap gap-1.5">
          <AdminStatusBadge tone={overview.statusTone}>{overview.statusLabel}</AdminStatusBadge>
          <AdminStatusBadge tone={loadState === "failed" ? "warning" : "neutral"}>
            {loadState === "loading" ? t("common.loadingShort", "조회 중") : t("settings.account.currentData", "현재 계정 기준")}
          </AdminStatusBadge>
        </div>
      }
      className="min-h-[320px]"
      bodyClassName="mt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.metrics.map((metric) => (
            <div key={metric.id} className={ADMIN_SURFACE_SUBTLE_BOX_CLASS}>
              <p className="text-[11px] font-semibold pbp-text-subtle">{metric.label}</p>
              <p className="mt-2 text-base font-semibold text-stone-950 sm:text-lg">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 pbp-text-muted">{metric.description}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {overview.actions.map((action) => (
            <div key={action.id} className={ADMIN_SURFACE_ITEM_CLASS}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold pbp-text-primary">{action.label}</p>
                <AdminStatusBadge tone={action.tone} size="xs">{action.statusLabel}</AdminStatusBadge>
              </div>
              <p className="mt-2 text-xs leading-5 pbp-text-muted">{action.description}</p>
              {action.requestType ? (
                <div className="mt-3">
                  <AdminButton
                    size="sm"
                    variant={action.requestType === "account_deactivation" ? "danger" : "secondary"}
                    onClick={() => {
                      setActiveRequestType(action.requestType ?? null);
                      setRequestState("idle");
                      setRequestFeedback("");
                    }}
                  >
                    {t("settings.accountRequest.open", "요청 작성")}
                  </AdminButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {activeRequestAction ? (
        <div className={`${ADMIN_SURFACE_ITEM_CLASS} rounded-[22px]`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold pbp-text-primary">{activeRequestAction.label}</p>
              <p className="mt-1 text-xs leading-5 pbp-text-muted">
                {t("settings.accountRequest.description", "변경하려는 내용과 사유를 적으면 시스템관리자가 검토할 수 있는 요청으로 접수됩니다.")}
              </p>
            </div>
            <AdminStatusBadge tone={activeRequestAction.tone} size="xs">{activeRequestAction.statusLabel}</AdminStatusBadge>
          </div>
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
            className="mt-3 min-h-28 w-full rounded-2xl border border-[var(--pbp-border)] bg-white px-3 py-2 text-sm leading-6 text-stone-900 outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]/20"
            placeholder={t("settings.accountRequest.placeholder", "예: 사업자명이 변경되었습니다. 변경 전/후 정보와 사유를 입력해 주세요.")}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 pbp-text-muted">
              {t("settings.accountRequest.validation", "10자 이상 입력해야 요청할 수 있습니다. 즉시 변경되지 않고 검토 요청으로 접수됩니다.")}
            </p>
            <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      ) : null}

      {requestFeedback ? (
        <div className={`${ADMIN_SURFACE_ITEM_CLASS} rounded-[22px] text-sm font-semibold ${requestState === "failed" ? "text-rose-700" : "text-emerald-700"}`}>
          {requestFeedback}
        </div>
      ) : null}

      <div className={`${ADMIN_SURFACE_ITEM_CLASS} grid gap-2 rounded-[22px] md:grid-cols-2`}>
        {overview.policyNotes.map((note) => (
          <p key={note} className="text-xs leading-5 pbp-text-muted">• {note}</p>
        ))}
      </div>
    </AdminSection>
  );
}

function FeedbackPanel() {
  const t = useAdminTranslation();
  const feedback = ADMIN_SETTINGS_NOTICE_BY_ID.feedback;
  const feedbackMailtoHref = useMemo(() => buildAdminFeedbackMailtoHref(), []);
  return (
    <AdminSection
      title={feedback.title}
      description={feedback.description}
      actions={
        <AdminLinkButton variant="primary" href={feedbackMailtoHref}>
          {t("settings.feedback.writeEmail", "이메일 작성하기")}
        </AdminLinkButton>
      }
      className="min-h-[320px]"
      bodyClassName="mt-4 space-y-4"
    >
      <div className={ADMIN_SURFACE_SUBTLE_BOX_CLASS}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">{t("settings.feedback.emailLabel", "Feedback email")}</p>
        <p className="mt-1 font-mono text-base font-semibold pbp-text-primary">{ADMIN_FEEDBACK_CONTACT_EMAIL}</p>
        <p className="mt-2 text-xs leading-5 pbp-text-muted">
          {t("settings.feedback.mailDescription", "현재는 DB 저장 없이 사용자의 기본 메일 앱으로 개선 요청, 오류 제보, 기능 제안 내용을 작성하는 방식으로 접수합니다.")}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.items.map((item) => (
            <div key={item} className={`${ADMIN_SURFACE_ITEM_CLASS} text-sm font-semibold pbp-text-primary`}>
              {item}
            </div>
          ))}
        </div>
        <div className={ADMIN_SURFACE_ITEM_CLASS}>
          <p className="text-xs font-semibold pbp-text-subtle">{t("settings.notice.nextStepTitle", "적용 예정")}</p>
          <p className="mt-2 text-sm leading-6 pbp-text-muted">{feedback.nextStep}</p>
        </div>
      </div>
    </AdminSection>
  );
}

export default function AdminSettingsHub() {
  const t = useAdminTranslation();
  const [activeMenuId, setActiveMenuId] = useState<AdminSettingsMenuId>("account");
  const [billingPlanOverview, setBillingPlanOverview] = useState<AdminBillingPlanOverview | null>(null);
  const [accountOverview, setAccountOverview] = useState<AdminAccountSettingsOverview | null>(null);
  const [billingPlanLoadState, setBillingPlanLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [accountLoadState, setAccountLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");

  useEffect(() => {
    let cancelled = false;
    setBillingPlanLoadState("loading");
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

    return () => {
      cancelled = true;
    };
  }, []);

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

      return <BillingPlanPanel overview={billingPlanOverview} loadState={billingPlanLoadState} />;
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

      return <AccountSettingsPanel overview={accountOverview} loadState={accountLoadState} />;
    }

    if (activeMenuId === "feedback") {
      return <FeedbackPanel />;
    }

    return <AdminEmptyState title={t("common.preparing", "준비중입니다.")} />;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0 sm:pr-1">
      <AdminSection
        title={t("settings.hub.title", "환경설정")}
        description={t("settings.hub.description", "계정 정보, 회사 운영 기준정보, 요금제, 개발 건의를 한 화면에서 전환해 확인합니다.")}
        actions={
          <p className="w-full rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-2 text-xs font-semibold leading-5 pbp-text-muted sm:w-auto">
            {t("settings.hub.scopeNotice", "개인별 언어와 색상 테마는 우측 상단 개인 설정에서 관리합니다.")}
          </p>
        }
        density="compact"
        className="shrink-0"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ADMIN_SETTINGS_MENU_ITEMS.map((item) => (
            <SettingsMenuCard key={item.id} item={item} active={activeMenuId === item.id} onClick={() => setActiveMenuId(item.id)} />
          ))}
        </div>
      </AdminSection>

      <section className="flex min-h-0 flex-1 flex-col">
        {renderActiveSettingsPanel()}
      </section>
    </div>
  );
}
