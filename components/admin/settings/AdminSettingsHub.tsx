"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLinkButton } from "@/components/admin/common/AdminButton";
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
import { ADMIN_BILLING_PLAN_PLACEHOLDER, type AdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";
import { ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER } from "@/lib/admin/settings/adminAccountSettingsPlaceholder";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminCurrentCompanyPayload = {
  ok?: boolean;
  billing?: AdminBillingPlanOverview;
};

const toneClassNames: Record<AdminSettingsMenuTone, { card: string; badgeTone: AdminStatusBadgeTone; dot: string }> = {
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

function SettingsMenuCard({ item, active, onClick }: { item: AdminSettingsMenuItem; active: boolean; onClick: () => void }) {
  const tone = toneClassNames[item.tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[112px] w-full min-w-0 flex-col justify-between rounded-[22px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 sm:min-h-[118px] ${tone.card} ${
        active ? "ring-2 ring-stone-950/10" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <span className="text-base font-semibold text-stone-950">{item.title}</span>
          </span>
          <span className="mt-2 block text-xs leading-5 text-stone-500">{item.description}</span>
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
            <div key={metric.id} className="rounded-[22px] border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-[11px] font-semibold text-emerald-600">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-stone-950">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{metric.description}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {overview.actions.map((action) => (
            <div key={action.id} className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-stone-900">{action.label}</p>
                <AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">{action.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2 rounded-[22px] border border-emerald-100 bg-white p-4 md:grid-cols-2">
        {overview.policyNotes.map((note) => (
          <p key={note} className="text-xs leading-5 text-stone-500">• {note}</p>
        ))}
      </div>
    </AdminSection>
  );
}

function AccountSettingsPanel() {
  const account = ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER;
  return (
    <AdminSection
      title={account.title}
      description={account.description}
      actions={<AdminStatusBadge tone="warning">{account.readOnlyLabel}</AdminStatusBadge>}
      className="min-h-[320px]"
      bodyClassName="mt-4 space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {account.metrics.map((metric) => (
            <div key={metric.id} className="rounded-[22px] border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-[11px] font-semibold text-amber-600">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-stone-950">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{metric.description}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {account.actions.map((action) => {
            const body = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900">{action.label}</p>
                  <AdminStatusBadge tone="neutral" size="xs">{action.statusLabel}</AdminStatusBadge>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">{action.description}</p>
              </>
            );

            if (action.id === "open-personal-settings") {
              return (
                <a key={action.id} className="block rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:bg-amber-50" href={account.personalSettingsHref}>
                  {body}
                </a>
              );
            }

            return (
              <div key={action.id} className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm">
                {body}
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2 rounded-[22px] border border-amber-100 bg-white p-4 md:grid-cols-2">
        {account.policyNotes.map((note) => (
          <p key={note} className="text-xs leading-5 text-stone-500">• {note}</p>
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
      <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-500">{t("settings.feedback.emailLabel", "Feedback email")}</p>
        <p className="mt-1 font-mono text-base font-semibold text-violet-900">{ADMIN_FEEDBACK_CONTACT_EMAIL}</p>
        <p className="mt-2 text-xs leading-5 text-violet-700">
          {t("settings.feedback.mailDescription", "현재는 DB 저장 없이 사용자의 기본 메일 앱으로 개선 요청, 오류 제보, 기능 제안 내용을 작성하는 방식으로 접수합니다.")}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.items.map((item) => (
            <div key={item} className="rounded-[22px] border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-700 shadow-sm">
              {item}
            </div>
          ))}
        </div>
        <div className="rounded-[22px] border border-violet-100 bg-white p-4">
          <p className="text-xs font-semibold text-violet-600">{t("settings.notice.nextStepTitle", "적용 예정")}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{feedback.nextStep}</p>
        </div>
      </div>
    </AdminSection>
  );
}

export default function AdminSettingsHub() {
  const t = useAdminTranslation();
  const [activeMenuId, setActiveMenuId] = useState<AdminSettingsMenuId>("standards");
  const [billingPlanOverview, setBillingPlanOverview] = useState<AdminBillingPlanOverview>(ADMIN_BILLING_PLAN_PLACEHOLDER);
  const [billingPlanLoadState, setBillingPlanLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");

  useEffect(() => {
    let cancelled = false;
    setBillingPlanLoadState("loading");

    fetch("/api/admin/companies/current", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as AdminCurrentCompanyPayload | null;
        if (cancelled) return;

        if (payload?.billing) {
          setBillingPlanOverview(payload.billing);
          setBillingPlanLoadState("loaded");
          return;
        }

        setBillingPlanLoadState("failed");
      })
      .catch(() => {
        if (!cancelled) {
          setBillingPlanLoadState("failed");
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
      return <BillingPlanPanel overview={billingPlanOverview} loadState={billingPlanLoadState} />;
    }

    if (activeMenuId === "account") {
      return <AccountSettingsPanel />;
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
        description={t("settings.hub.description", "회사 운영 기준정보, 요금제, 계정, 개발 건의를 한 화면에서 전환해 확인합니다.")}
        actions={
          <p className="w-full rounded-2xl bg-stone-50 px-3 py-2 text-xs font-semibold leading-5 text-stone-500 sm:w-auto">
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
