type AdminTopbarProps = {
  title: string;
  description?: string;
};

const PAGE_SUMMARIES: Record<string, string> = {
  "관리자 운영 화면": "운영 통계 · 상태 흐름 · 오늘 체크",
  "저장소 관리": "첨부파일 · 휴지통 · 용량 관리",
  "거래처 / 공장 관리": "거래처 · 공장 · 외주처",
  "통계 / 대시보드": "작지 · 거래처 · 파일 사용량",
  "환경설정": "기준 설정 · 저장 정책 · 로그 이벤트",
};

function getTopbarSummary(title: string, description?: string): string | null {
  if (description) return description;
  if (title.includes("히스토리")) return "상태 변경 · 주요 작업 기록";
  return PAGE_SUMMARIES[title] ?? null;
}

export default function AdminTopbar({ title, description }: AdminTopbarProps) {
  const summary = getTopbarSummary(title, description);

  return (
    <header className="rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="flex min-w-0 flex-col gap-2">
        {summary ? (
          <div className="flex">
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">{summary}</span>
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950 md:text-3xl">{title}</h1>
      </div>
    </header>
  );
}
