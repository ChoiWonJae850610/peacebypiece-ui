"use client";

import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminTopbarProps = {
  title: string;
  description?: string;
};

function getTopbarSummary(title: string, description: string | undefined, t: ReturnType<typeof useAdminTranslation>): string | null {
  if (description) return description;
  if (title.includes(t("historySection.title", "히스토리"))) return t("topbar.summaries.history", "상태 변경 · 주요 작업 기록");

  const summaries: Record<string, string> = {
    [t("navigation.dashboard", "대시보드")]: t("topbar.summaries.adminMain", "운영 통계 · 상태 흐름 · 오늘 체크"),
    [t("navigation.storage", "저장소 관리")]: t("topbar.summaries.storage", "첨부파일 · 휴지통 · 용량 관리"),
    [t("navigation.partners", "협력업체 관리")]: t("topbar.summaries.partners", "협력업체 · 공장 · 외주처"),
    [t("dashboardPage.title", "통계정보")]: t("topbar.summaries.dashboard", "작업지시서 · 협력업체 · 파일 사용량"),
    [t("navigation.settings", "환경설정")]: t("topbar.summaries.settings", "기준 설정 · 저장 정책 · 로그 이벤트"),
  };

  return summaries[title] ?? null;
}

export default function AdminTopbar({ title, description }: AdminTopbarProps) {
  const t = useAdminTranslation();
  const summary = getTopbarSummary(title, description, t);

  return (
    <header className="rounded-[30px] border border-stone-200 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
      <div className="flex min-w-0 flex-col gap-2">
        {summary ? (
          <div className="flex">
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">{summary}</span>
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">{title}</h1>
      </div>
    </header>
  );
}
