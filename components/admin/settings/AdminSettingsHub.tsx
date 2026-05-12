"use client";

import { useMemo, useState } from "react";
import { AdminModal, AdminModalSection, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import {
  ADMIN_SETTINGS_MENU_ITEMS,
  ADMIN_SETTINGS_NOTICE_BY_ID,
  type AdminSettingsMenuId,
  type AdminSettingsMenuItem,
  type AdminSettingsMenuTone,
} from "@/lib/admin/settings/adminSettingsHub";
import { ADMIN_FEEDBACK_CONTACT_EMAIL, buildAdminFeedbackMailtoHref } from "@/lib/admin/settings/adminFeedbackContact";
import { ADMIN_BILLING_PLAN_PLACEHOLDER } from "@/lib/admin/settings/adminBillingPlanPlaceholder";

type NoticeMenuId = Exclude<AdminSettingsMenuId, "standards">;

const toneClassNames: Record<AdminSettingsMenuTone, { card: string; badge: string; dot: string }> = {
  stone: {
    card: "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50",
    badge: "bg-stone-950 text-white",
    dot: "bg-stone-900",
  },
  blue: {
    card: "border-blue-100 bg-blue-50/80 hover:border-blue-200 hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/80 hover:border-amber-200 hover:bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50/80 hover:border-emerald-200 hover:bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  violet: {
    card: "border-violet-100 bg-violet-50/80 hover:border-violet-200 hover:bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
};

function isNoticeMenuId(id: AdminSettingsMenuId): id is NoticeMenuId {
  return id !== "standards";
}

function SettingsMenuCard({ item, active, onClick }: { item: AdminSettingsMenuItem; active: boolean; onClick: () => void }) {
  const tone = toneClassNames[item.tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[132px] flex-col justify-between rounded-[24px] border p-3.5 text-left shadow-sm transition ${tone.card} ${
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
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>{item.statusLabel}</span>
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
  const [activeMenuId, setActiveMenuId] = useState<AdminSettingsMenuId>("standards");
  const [noticeMenuId, setNoticeMenuId] = useState<NoticeMenuId | null>(null);
  const notice = useMemo(() => (noticeMenuId ? ADMIN_SETTINGS_NOTICE_BY_ID[noticeMenuId] : null), [noticeMenuId]);
  const feedbackMailtoHref = useMemo(() => buildAdminFeedbackMailtoHref(), []);
  const isFeedbackNotice = noticeMenuId === "feedback";
  const isBillingNotice = noticeMenuId === "billing";

  const handleSelectMenu = (id: AdminSettingsMenuId) => {
    if (isNoticeMenuId(id)) {
      setNoticeMenuId(id);
      return;
    }
    setActiveMenuId(id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <section className="shrink-0 rounded-[28px] border border-stone-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">환경설정</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">회사 운영 기준, 알림, 요금제, 계정, 개발 건의를 한 화면에서 관리합니다.</p>
          </div>
          <p className="rounded-2xl bg-stone-50 px-3 py-2 text-xs font-semibold leading-5 text-stone-500">
            권한 관리는 멤버관리 화면에서 별도로 다룹니다.
          </p>
        </div>
        <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          {ADMIN_SETTINGS_MENU_ITEMS.map((item) => (
            <SettingsMenuCard key={item.id} item={item} active={activeMenuId === item.id} onClick={() => handleSelectMenu(item.id)} />
          ))}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <AdminStandardsSection mode="standards-only" />
      </section>

      <AdminModal
        open={Boolean(notice)}
        title={notice?.title ?? "준비중입니다."}
        description={notice?.description}
        onClose={() => setNoticeMenuId(null)}
        maxWidthClass="md:max-w-2xl"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {isFeedbackNotice ? (
              <a className={adminModalPrimaryButtonClassName} href={feedbackMailtoHref}>
                이메일 작성하기
              </a>
            ) : null}
            <button type="button" className={isFeedbackNotice ? adminModalSecondaryButtonClassName : adminModalPrimaryButtonClassName} onClick={() => setNoticeMenuId(null)}>
              확인
            </button>
          </div>
        }
      >
        {notice ? (
          <AdminModalSection title="적용 예정" description={notice.nextStep}>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">Billing policy</p>
                    <h3 className="mt-1 text-sm font-semibold text-blue-950">{ADMIN_BILLING_PLAN_PLACEHOLDER.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-blue-700">{ADMIN_BILLING_PLAN_PLACEHOLDER.description}</p>
                  </div>
                  <span className="w-fit rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    {ADMIN_BILLING_PLAN_PLACEHOLDER.systemManagedLabel}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADMIN_BILLING_PLAN_PLACEHOLDER.metrics.map((metric) => (
                    <div key={metric.id} className="rounded-2xl border border-blue-100 bg-white p-3">
                      <p className="text-[11px] font-semibold text-blue-500">{metric.label}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-950">{metric.value}</p>
                      <p className="mt-1 text-[11px] leading-5 text-stone-500">{metric.description}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {ADMIN_BILLING_PLAN_PLACEHOLDER.actions.map((action) => (
                    <div key={action.id} className="rounded-2xl border border-blue-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-stone-900">{action.label}</p>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">{action.statusLabel}</span>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-stone-500">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {isFeedbackNotice ? (
              <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-500">Feedback email</p>
                <p className="mt-1 font-mono text-sm font-semibold text-violet-900">{ADMIN_FEEDBACK_CONTACT_EMAIL}</p>
                <p className="mt-2 text-xs leading-5 text-violet-700">
                  현재는 DB 저장 없이 사용자의 기본 메일 앱으로 개선 요청, 오류 제보, 기능 제안 내용을 작성하는 방식으로 접수합니다.
                </p>
              </div>
            ) : null}
          </AdminModalSection>
        ) : null}
      </AdminModal>
    </div>
  );
}
