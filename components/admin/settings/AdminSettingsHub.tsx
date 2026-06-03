"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflFeatureCard from "@/components/admin/common/WaflFeatureCard";
import WaflNoticeBox from "@/components/admin/common/WaflNoticeBox";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import WaflSettingCard from "@/components/admin/common/WaflSettingCard";
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

const toneClassNames: Record<AdminSettingsMenuTone, { badgeTone: AdminStatusBadgeTone; dot: string }> = {
  blue: {
    badgeTone: "info",
    dot: "bg-[var(--pbp-status-neutral-bg)]",
  },
  amber: {
    badgeTone: "warning",
    dot: "bg-[var(--pbp-status-warning)]",
  },
  emerald: {
    badgeTone: "success",
    dot: "bg-[var(--pbp-status-success)]",
  },
  violet: {
    badgeTone: "maintenance",
    dot: "bg-[var(--pbp-accent)]",
  },
};

function SettingsMenuCard({ item, active, onClick }: { item: AdminSettingsMenuItem; active: boolean; onClick: () => void }) {
  const tone = toneClassNames[item.tone];
  return (
    <WaflFeatureCard
      title={item.title}
      description={item.description}
      badge={<AdminStatusBadge tone={tone.badgeTone}>{item.statusLabel}</AdminStatusBadge>}
      details={item.detailItems}
      active={active}
      leadingDotClassName={tone.dot}
      onClick={onClick}
    />
  );
}

function BillingPlanPanel({ overview, loadState }: { overview: AdminBillingPlanOverview; loadState: "idle" | "loading" | "loaded" | "failed" }) {
  const t = useAdminTranslation();
  return (
    <WaflSectionPanel
      eyebrow={t("settings.billing.eyebrow", "요금제·저장공간")}
      title={overview.title}
      description={overview.description}
      actions={
        <>
          <AdminStatusBadge tone="success">{overview.currentPlanLabel}</AdminStatusBadge>
          <AdminStatusBadge tone="maintenance">{overview.systemManagedLabel}</AdminStatusBadge>
          <AdminStatusBadge tone={loadState === "failed" ? "warning" : "neutral"}>
            {loadState === "loading" ? t("common.loadingShort", "조회 중") : overview.dataSourceLabel}
          </AdminStatusBadge>
        </>
      }
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {overview.metrics.map((metric) => (
            <WaflSettingCard key={metric.id} title={metric.value} description={metric.description} eyebrow={metric.label} tone="success" />
          ))}
        </div>
        <div className="space-y-3">
          {overview.actions.map((action) => (
            <WaflSettingCard
              key={action.id}
              title={action.label}
              description={action.description}
              badge={<AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>}
              tone="info"
            />
          ))}
        </div>
      </div>
      <WaflNoticeBox tone="info" className="rounded-[22px]">
        <div className="grid gap-2 md:grid-cols-2">
          {overview.policyNotes.map((note) => (
            <p key={note}>• {note}</p>
          ))}
        </div>
      </WaflNoticeBox>
    </WaflSectionPanel>
  );
}

function AccountSettingsPanel({ overview, loadState }: { overview: AdminAccountSettingsOverview; loadState: "idle" | "loading" | "loaded" | "failed" }) {
  const t = useAdminTranslation();
  const [activeRequestType, setActiveRequestType] = useState<"company_info_change" | "account_deactivation" | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "submitting" | "submitted" | "failed">("idle");
  const [requestFeedback, setRequestFeedback] = useState("");
  const [requestFeedbackTone, setRequestFeedbackTone] = useState<ToastTone>("info");
  const [requestFeedbackEventKey, setRequestFeedbackEventKey] = useState(0);

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
      setRequestFeedbackTone("success");
      setRequestFeedbackEventKey((currentKey) => currentKey + 1);
      setRequestFeedback(t("settings.accountRequest.submitted", "요청이 접수되었습니다. 시스템관리자 검토 후 처리됩니다."));
      setRequestMessage("");
      setActiveRequestType(null);
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
      description={overview.description}
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.metrics.map((metric) => (
            <WaflSettingCard key={metric.id} title={metric.value} description={metric.description} eyebrow={metric.label} tone="warning" />
          ))}
        </div>
        <div className="space-y-3">
          {overview.actions.map((action) => (
            <WaflSettingCard
              key={action.id}
              title={action.label}
              description={action.description}
              badge={<AdminStatusBadge tone={action.tone} size="xs">{action.statusLabel}</AdminStatusBadge>}
              tone={action.requestType === "account_deactivation" ? "danger" : "info"}
              actions={
                action.requestType ? (
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
                ) : null
              }
            />
          ))}
        </div>
      </div>

      {activeRequestAction ? (
        <WaflSettingCard
          title={activeRequestAction.label}
          description={t("settings.accountRequest.description", "변경하려는 내용과 사유를 적으면 시스템관리자가 검토할 수 있는 요청으로 접수됩니다.")}
          badge={<AdminStatusBadge tone={activeRequestAction.tone} size="xs">{activeRequestAction.statusLabel}</AdminStatusBadge>}
          tone={activeRequestType === "account_deactivation" ? "danger" : "warning"}
          bodyClassName="mt-3"
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
        </WaflSettingCard>
      ) : null}

      <ToastMessage message={requestFeedback || null} tone={requestFeedbackTone} eventKey={requestFeedbackEventKey} />

      <WaflNoticeBox tone="info" className="rounded-[22px]">
        <div className="grid gap-2 md:grid-cols-2">
          {overview.policyNotes.map((note) => (
            <p key={note}>• {note}</p>
          ))}
        </div>
      </WaflNoticeBox>
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
      actions={<AdminStatusBadge tone="maintenance">{t("common.preparing", "준비중")}</AdminStatusBadge>}
      className="min-h-[320px]"
      bodyClassName="pt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {notice.items.map((item) => (
            <WaflSettingCard key={item} title={item} tone="neutral" />
          ))}
        </div>
        <WaflSettingCard
          eyebrow={t("settings.notice.nextStepTitle", "적용 예정")}
          title={notice.nextStep}
          tone="info"
        />
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
      eyebrow={t("settings.feedback.eyebrow", "개발 건의")}
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
      <WaflSettingCard
        eyebrow={t("settings.feedback.emailLabel", "접수 이메일")}
        title={<span className="font-mono">{ADMIN_FEEDBACK_CONTACT_EMAIL}</span>}
        description={t("settings.feedback.mailDescription", "개선 요청, 오류 제보, 기능 제안 내용을 기본 메일 앱으로 작성해 전달합니다.")}
        tone="info"
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.items.map((item) => (
            <WaflSettingCard key={item} title={item} tone="neutral" />
          ))}
        </div>
        <WaflSettingCard
          eyebrow={t("settings.notice.nextStepTitle", "적용 예정")}
          title={feedback.nextStep}
          tone="info"
        />
      </div>
    </WaflSectionPanel>
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
        description={t("settings.hub.description", "회사 정보, 기준정보, 요금제, 약관·정책, 개선 요청을 한 화면에서 확인합니다.")}
        badges={
          <WaflNoticeBox tone="neutral" className="w-full rounded-full px-4 py-2 sm:w-auto">
            {t("settings.hub.scopeNotice", "개인별 언어와 색상 테마는 우측 상단 개인 설정에서 관리합니다.")}
          </WaflNoticeBox>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {ADMIN_SETTINGS_MENU_ITEMS.map((item) => (
            <SettingsMenuCard key={item.id} item={item} active={activeMenuId === item.id} onClick={() => setActiveMenuId(item.id)} />
          ))}
        </div>
      </WaflPageHero>

      <section className="flex min-h-0 flex-1 flex-col">
        {renderActiveSettingsPanel()}
      </section>
    </div>
  );
}
