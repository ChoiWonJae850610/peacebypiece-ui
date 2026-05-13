"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { AdminModal, AdminModalSection } from "@/components/admin/layout/AdminModal";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import AdminCompanySettingsForm from "@/components/admin/settings/AdminCompanySettingsForm";
import {
  ADMIN_SETTINGS_MENU_ITEMS,
  ADMIN_SETTINGS_NOTICE_BY_ID,
  type AdminSettingsMenuId,
  type AdminSettingsMenuItem,
  type AdminSettingsMenuTone,
} from "@/lib/admin/settings/adminSettingsHub";
import { ADMIN_FEEDBACK_CONTACT_EMAIL, buildAdminFeedbackMailtoHref } from "@/lib/admin/settings/adminFeedbackContact";
import { ADMIN_BILLING_PLAN_PLACEHOLDER, type AdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";
import { ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER } from "@/lib/admin/settings/adminAccountSettingsPlaceholder";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { AdminCompanySummary, CompanySettings } from "@/lib/admin/settings/companyTypes";

type NoticeMenuId = Exclude<AdminSettingsMenuId, "company" | "standards">;

type AdminCurrentCompanyPayload = {
  ok?: boolean;
  company?: AdminCompanySummary;
  settings?: CompanySettings;
  billing?: AdminBillingPlanOverview;
};

const toneClassNames: Record<AdminSettingsMenuTone, { card: string; badgeTone: AdminStatusBadgeTone; dot: string }> = {
  stone: {
    card: "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50",
    badgeTone: "primary",
    dot: "bg-stone-900",
  },
  blue: {
    card: "border-blue-100 bg-blue-50/80 hover:border-blue-200 hover:bg-blue-50",
    badgeTone: "info",
    dot: "bg-blue-500",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/80 hover:border-amber-200 hover:bg-amber-50",
    badgeTone: "warning",
    dot: "bg-amber-500",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50/80 hover:border-emerald-200 hover:bg-emerald-50",
    badgeTone: "success",
    dot: "bg-emerald-500",
  },
  violet: {
    card: "border-violet-100 bg-violet-50/80 hover:border-violet-200 hover:bg-violet-50",
    badgeTone: "maintenance",
    dot: "bg-violet-500",
  },
};

function isNoticeMenuId(id: AdminSettingsMenuId): id is NoticeMenuId {
  return id !== "company" && id !== "standards";
}

function SettingsMenuCard({ item, active, onClick }: { item: AdminSettingsMenuItem; active: boolean; onClick: () => void }) {
  const tone = toneClassNames[item.tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[124px] w-full min-w-0 flex-col justify-between rounded-[22px] border p-3 text-left shadow-sm transition sm:min-h-[132px] sm:rounded-[24px] sm:p-3.5 ${tone.card} ${
        active ? "ring-2 ring-stone-950/10" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <span className="text-base font-semibold text-stone-950">{item.title}</span>
          </span>
          <span className="mt-1.5 block text-xs leading-5 text-stone-500">{item.description}</span>
        </span>
        <AdminStatusBadge tone={tone.badgeTone}>{item.statusLabel}</AdminStatusBadge>
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {item.detailItems.map((detail) => (
          <span key={detail} className="rounded-full border border-white/80 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-stone-500 shadow-sm">
            {detail}
          </span>
        ))}
      </span>
    </button>
  );
}

export default function AdminSettingsHub() {
  const t = useAdminTranslation();
  const [activeMenuId, setActiveMenuId] = useState<AdminSettingsMenuId>("company");
  const [noticeMenuId, setNoticeMenuId] = useState<NoticeMenuId | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [companySummary, setCompanySummary] = useState<AdminCompanySummary | null>(null);
  const [companySettingsLoadState, setCompanySettingsLoadState] = useState<"loading" | "loaded" | "failed">("loading");
  const [billingPlanOverview, setBillingPlanOverview] = useState<AdminBillingPlanOverview>(ADMIN_BILLING_PLAN_PLACEHOLDER);
  const [billingPlanLoadState, setBillingPlanLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const notice = useMemo(() => (noticeMenuId ? ADMIN_SETTINGS_NOTICE_BY_ID[noticeMenuId] : null), [noticeMenuId]);
  const feedbackMailtoHref = useMemo(() => buildAdminFeedbackMailtoHref(), []);
  const isFeedbackNotice = noticeMenuId === "feedback";
  const isBillingNotice = noticeMenuId === "billing";
  const isAccountNotice = noticeMenuId === "account";

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/companies/current", { cache: "no-store" })
      .then(async (response) => (await response.json().catch(() => null)) as AdminCurrentCompanyPayload | null)
      .then((payload) => {
        if (cancelled) return;
        if (payload?.settings) {
          setCompanySettings(payload.settings);
          setCompanySummary(payload.company ?? null);
          if (payload.billing) {
            setBillingPlanOverview(payload.billing);
            setBillingPlanLoadState("loaded");
          }
          setCompanySettingsLoadState("loaded");
          return;
        }
        setCompanySettingsLoadState("failed");
      })
      .catch(() => {
        if (!cancelled) {
          setCompanySettingsLoadState("failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isBillingNotice || billingPlanLoadState !== "idle") {
      return;
    }

    let cancelled = false;
    setBillingPlanLoadState("loading");

    fetch("/api/admin/companies/current", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { billing?: AdminBillingPlanOverview } | null;
        if (!cancelled && payload?.billing) {
          setBillingPlanOverview(payload.billing);
          setBillingPlanLoadState("loaded");
          return;
        }

        if (!cancelled) {
          setBillingPlanLoadState("failed");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBillingPlanLoadState("failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [billingPlanLoadState, isBillingNotice]);

  const handleSelectMenu = (id: AdminSettingsMenuId) => {
    if (isNoticeMenuId(id)) {
      setNoticeMenuId(id);
      return;
    }
    setActiveMenuId(id);
  };

  const renderActiveSettingsPanel = () => {
    if (activeMenuId === "standards") {
      return <AdminStandardsSection mode="standards-only" />;
    }

    if (companySettingsLoadState === "loading") {
      return <AdminEmptyState title={t("settings.company.loading", "회사 설정을 불러오는 중입니다.")} />;
    }

    if (!companySettings) {
      return <AdminEmptyState title={t("settings.company.loadFailed", "회사 설정을 불러오지 못했습니다.")} description={t("settings.company.loadFailedDescription", "새로고침 후 다시 확인해 주세요.")} tone="danger" />;
    }

    return <AdminCompanySettingsForm initialSettings={companySettings} companyName={companySummary?.name} />;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0 sm:pr-1">
      <AdminSection
        title={t("settings.hub.title", "환경설정")}
        description={t("settings.hub.description", "실제로 저장되는 회사·화면 설정과 작업 기준정보를 중심으로 정리합니다.")}
        actions={
          <p className="w-full rounded-2xl bg-stone-50 px-3 py-2 text-xs font-semibold leading-5 text-stone-500 sm:w-auto">
            {t("settings.hub.scopeNotice", "권한은 멤버관리, 요금제·용량은 시스템관리자 기준으로 분리합니다.")}
          </p>
        }
        density="compact"
        className="shrink-0"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          {ADMIN_SETTINGS_MENU_ITEMS.map((item) => (
            <SettingsMenuCard key={item.id} item={item} active={activeMenuId === item.id} onClick={() => handleSelectMenu(item.id)} />
          ))}
        </div>
      </AdminSection>

      <section className="flex min-h-0 flex-1 flex-col">
        {renderActiveSettingsPanel()}
      </section>

      <AdminModal
        open={Boolean(notice)}
        title={notice?.title ?? t("common.preparing", "준비중입니다.")}
        description={notice?.description}
        onClose={() => setNoticeMenuId(null)}
        maxWidthClass="md:max-w-2xl"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {isFeedbackNotice ? (
              <AdminLinkButton variant="primary" href={feedbackMailtoHref}>
                {t("settings.feedback.writeEmail", "이메일 작성하기")}
              </AdminLinkButton>
            ) : null}
            <AdminButton variant={isFeedbackNotice ? "secondary" : "primary"} onClick={() => setNoticeMenuId(null)}>
              {t("common.confirm", "확인")}
            </AdminButton>
          </div>
        }
      >
        {notice ? (
          <AdminModalSection title={t("settings.notice.nextStepTitle", "적용 예정")} description={notice.nextStep}>
            <div className="grid gap-2 sm:grid-cols-2">
              {notice.items.map((item) => (
                <div key={item} className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-700">
                  {item}
                </div>
              ))}
            </div>
            {isBillingNotice ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">{t("settings.billing.policyLabel", "Billing policy")}</p>
                    <h3 className="mt-1 text-sm font-semibold text-blue-950">{billingPlanOverview.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-blue-700">{billingPlanOverview.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <AdminStatusBadge tone="maintenance">{billingPlanOverview.systemManagedLabel}</AdminStatusBadge>
                    <AdminStatusBadge tone="maintenance">{billingPlanLoadState === "loading" ? t("common.loadingShort", "조회 중") : billingPlanOverview.dataSourceLabel}</AdminStatusBadge>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {billingPlanOverview.metrics.map((metric) => (
                    <div key={metric.id} className="rounded-2xl border border-blue-100 bg-white p-3">
                      <p className="text-[11px] font-semibold text-blue-500">{metric.label}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-950">{metric.value}</p>
                      <p className="mt-1 text-[11px] leading-5 text-stone-500">{metric.description}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {billingPlanOverview.actions.map((action) => (
                    <div key={action.id} className="rounded-2xl border border-blue-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-stone-900">{action.label}</p>
                        <AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-stone-500">{action.description}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 rounded-2xl border border-blue-100 bg-white p-3">
                  {billingPlanOverview.policyNotes.map((note) => (
                    <p key={note} className="text-[11px] leading-5 text-stone-500">• {note}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {isAccountNotice ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-500">Account policy</p>
                    <h3 className="mt-1 text-sm font-semibold text-emerald-950">{ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">{ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.description}</p>
                  </div>
                  <AdminStatusBadge tone="success">{ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.readOnlyLabel}</AdminStatusBadge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.metrics.map((metric) => (
                    <div key={metric.id} className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <p className="text-[11px] font-semibold text-emerald-500">{metric.label}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-950">{metric.value}</p>
                      <p className="mt-1 text-[11px] leading-5 text-stone-500">{metric.description}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.actions.map((action) => {
                    const actionBody = (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-stone-900">{action.label}</p>
                          <AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-stone-500">{action.description}</p>
                      </>
                    );

                    if (action.id === "open-personal-settings") {
                      return (
                        <a key={action.id} className="rounded-2xl border border-emerald-100 bg-white p-3 transition hover:border-emerald-200 hover:bg-emerald-50" href={ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.personalSettingsHref}>
                          {actionBody}
                        </a>
                      );
                    }

                    return (
                      <div key={action.id} className="rounded-2xl border border-emerald-100 bg-white p-3">
                        {actionBody}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5 rounded-2xl border border-emerald-100 bg-white p-3">
                  {ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER.policyNotes.map((note) => (
                    <p key={note} className="text-[11px] leading-5 text-stone-500">• {note}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {isFeedbackNotice ? (
              <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-500">{t("settings.feedback.emailLabel", "Feedback email")}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-violet-900">{ADMIN_FEEDBACK_CONTACT_EMAIL}</p>
                <p className="mt-2 text-xs leading-5 text-violet-700">
                  {t("settings.feedback.mailDescription", "현재는 DB 저장 없이 사용자의 기본 메일 앱으로 개선 요청, 오류 제보, 기능 제안 내용을 작성하는 방식으로 접수합니다.")}
                </p>
              </div>
            ) : null}
          </AdminModalSection>
        ) : null}
      </AdminModal>
    </div>
  );
}
