type AdminTopbarProps = {
  title: string;
  description?: string;
};

const PAGE_SUMMARIES: Record<string, string> = {
  "관리자 운영 화면": "운영 통계 · 상태 흐름 · 오늘 체크",
  "저장소 관리": "첨부파일 · 휴지통 · 용량 관리",
  "협력업체 관리": "협력업체 · 공장 · 외주처",
  "통계 / 대시보드": "작업지시서 · 협력업체 · 파일 사용량",
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
