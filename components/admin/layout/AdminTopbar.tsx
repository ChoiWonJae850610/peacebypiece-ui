"use client";

import Link from "next/link";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminTopbarProps = {
  companyName: string;
  appVersion: string;
  title: string;
  description?: string;
};

function getTopbarSummary(title: string, description: string | undefined, t: ReturnType<typeof useAdminTranslation>): string | null {
  if (description) return description;
  if (title.includes(t("historySection.title", "히스토리"))) return t("topbar.summaries.history", "상태 변경 · 주요 작업 기록");

  const summaries: Record<string, string> = {
    [t("navigation.storage", "저장소 관리")]: t("topbar.summaries.storage", "첨부파일 · 휴지통 · 용량 관리"),
    [t("navigation.partners", "협력업체 관리")]: t("topbar.summaries.partners", "협력업체 · 공장 · 외주처"),
    [t("dashboardPage.title", "통계정보")]: t("topbar.summaries.dashboard", "작업지시서 · 협력업체 · 파일 사용량"),
    [t("navigation.settings", "환경설정")]: t("topbar.summaries.settings", "기준 설정 · 저장 정책 · 로그 이벤트"),
  };

  return summaries[title] ?? null;
}

function getLocalizedTopbarTitle(title: string, t: ReturnType<typeof useAdminTranslation>): string {
  const titleMap: Record<string, string> = {
    "고객관리자 메인": t("operationsDashboard.title", "운영 대시보드"),
    "협력업체 관리": t("navigation.partners", "협력업체 관리"),
    "저장소 관리": t("navigation.storage", "저장소 관리"),
    "통계정보": t("dashboardPage.title", "통계정보"),
    "히스토리": t("historySection.title", "히스토리"),
    "환경설정": t("navigation.settings", "환경설정"),
  };

  return titleMap[title] ?? title;
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2.05 2.05 0 0 1-2.9 2.9l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92V20.5a2.05 2.05 0 0 1-4.1 0v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.05.05a2.05 2.05 0 0 1-2.9-2.9l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1H3.5a2.05 2.05 0 0 1 0-4.1h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.05-.05a2.05 2.05 0 0 1 2.9-2.9l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92V3.5a2.05 2.05 0 0 1 4.1 0v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.05-.05a2.05 2.05 0 0 1 2.9 2.9l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .92 1h.18a2.05 2.05 0 0 1 0 4.1h-.08a1.7 1.7 0 0 0-1.02.9Z" />
    </svg>
  );
}

export default function AdminTopbar({ companyName, appVersion, title, description }: AdminTopbarProps) {
  const t = useAdminTranslation();
  const localizedTitle = getLocalizedTopbarTitle(title, t);
  const summary = getTopbarSummary(localizedTitle, description, t);

  return (
    <header className="rounded-[30px] border border-stone-200 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">
              PeacebyPiece
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">{companyName}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">v{appVersion}</span>
          </div>
          {summary ? (
            <div className="mt-3 flex">
              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">{summary}</span>
            </div>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{localizedTitle}</h1>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/admin" className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50">
            {t("topbar.actions.home", "홈")}
          </Link>
          <Link href="/me/settings" aria-label={t("topbar.actions.personalSettings", "개인 설정")} title={t("topbar.actions.personalSettings", "개인 설정")} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50">
            <SettingsIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
