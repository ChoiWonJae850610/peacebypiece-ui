"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminModal } from "@/components/admin/layout/AdminModal";
import { PersonalSettingsPanel } from "@/components/me/PersonalSettingsPage";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
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
    [t("memberManagement.title", "멤버 관리")]: t("topbar.summaries.members", "멤버 초대 · 역할 · 권한 설계"),
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
    "멤버 관리": t("memberManagement.title", "멤버 관리"),
    "Member management": t("memberManagement.title", "멤버 관리"),
  };

  return titleMap[title] ?? title;
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.6 12 3.75l8.5 6.85" />
      <path d="M5.75 9.5v9.25a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M9.75 20.25v-5.5a1.25 1.25 0 0 1 1.25-1.25h2a1.25 1.25 0 0 1 1.25 1.25v5.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20.25a7.25 7.25 0 0 1 14.5 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2.05 2.05 0 0 1-2.9 2.9l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92V20.5a2.05 2.05 0 0 1-4.1 0v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.05.05a2.05 2.05 0 0 1-2.9-2.9l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1H3.5a2.05 2.05 0 0 1 0-4.1h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.05-.05a2.05 2.05 0 0 1 2.9-2.9l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92V3.5a2.05 2.05 0 0 1 4.1 0v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.05-.05a2.05 2.05 0 0 1 2.9 2.9l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .92 1h.18a2.05 2.05 0 0 1 0 4.1h-.08a1.7 1.7 0 0 0-1.02.9Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.75H6.75A1.75 1.75 0 0 0 5 6.5v11a1.75 1.75 0 0 0 1.75 1.75H9.5" />
      <path d="M14 8.25 17.75 12 14 15.75" />
      <path d="M17.5 12H9.75" />
    </svg>
  );
}

export default function AdminTopbar({ companyName, appVersion, title, description }: AdminTopbarProps) {
  const t = useAdminTranslation();
  const { user } = useCurrentUser();
  const [personalSettingsOpen, setPersonalSettingsOpen] = useState(false);
  const [reviveKey, setReviveKey] = useState(0);

  useEffect(() => {
    const reviveTopbarActions = () => {
      setPersonalSettingsOpen(false);
      setReviveKey((current) => current + 1);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reviveTopbarActions();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const displayCompanyName = user?.companyName ?? companyName;
  const canOpenAdminSettings = user?.role === "company_admin";
  const localizedTitle = getLocalizedTopbarTitle(title, t);
  const summary = getTopbarSummary(localizedTitle, description, t);

  return (
    <header className="pbp-topbar-shell relative z-20 rounded-[24px] px-4 py-3 backdrop-blur sm:rounded-[30px] sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pbp-topbar-chip-primary rounded-full px-3 py-1.5 text-xs font-semibold">
              WAFL
            </span>
            <span className="pbp-topbar-chip-muted rounded-full px-3 py-1.5 text-xs font-semibold">{displayCompanyName}</span>
            <span className="pbp-topbar-chip-muted rounded-full px-3 py-1.5 text-xs font-semibold">v{appVersion}</span>
          </div>
          {summary ? (
            <div className="mt-2 flex sm:mt-3">
              <span className="pbp-topbar-chip-muted rounded-2xl px-3 py-1.5 text-xs font-semibold leading-5">{summary}</span>
            </div>
          ) : null}
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--pbp-text-primary)] sm:text-2xl">{localizedTitle}</h1>
        </div>

        <div key={reviveKey} className="relative z-30 flex shrink-0 flex-wrap gap-2">
          <Link
            href="/workspace"
            aria-label={t("topbar.actions.home", "홈")}
            title={t("topbar.actions.home", "홈")}
            className="pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full transition"
          >
            <HomeIcon />
          </Link>
          <button
            type="button"
            onClick={() => setPersonalSettingsOpen(true)}
            aria-label={t("topbar.actions.personalSettings", "개인 설정")}
            title={t("topbar.actions.personalSettings", "개인 설정")}
            className="pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full transition"
          >
            <UserIcon />
          </button>
          {canOpenAdminSettings ? (
            <Link
              href="/workspace/settings"
              aria-label={t("topbar.actions.adminSettings", "환경설정")}
              title={t("topbar.actions.adminSettings", "환경설정")}
              className="pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full transition"
            >
              <SettingsIcon />
            </Link>
          ) : null}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              aria-label={t("topbar.actions.logout", "로그아웃")}
              title={t("topbar.actions.logout", "로그아웃")}
              className="pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full transition"
            >
              <LogoutIcon />
            </button>
          </form>
        </div>
      </div>
      <AdminModal
        open={personalSettingsOpen}
        title={t("topbar.actions.personalSettings", "개인 설정")}
        description={t("topbar.personalSettingsDescription", "언어와 테마만 개인별로 변경합니다.")}
        onClose={() => setPersonalSettingsOpen(false)}
        maxWidthClass="md:max-w-2xl"
        bodyClassName="space-y-4 [scrollbar-gutter:stable]"
        minHeightClassName="md:min-h-[420px]"
      >
        <PersonalSettingsPanel />
      </AdminModal>
    </header>
  );
}
