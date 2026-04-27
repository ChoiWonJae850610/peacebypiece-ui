import Link from "next/link";
import AdminWorkspaceTools from "@/components/admin/AdminWorkspaceTools";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

const summaryCards = [
  { label: "진행 중 작지", value: "0", href: "/worker" },
  { label: "검토 대기", value: "0", href: "/worker" },
  { label: "발주 준비", value: "0", href: "/worker" },
  { label: "첨부파일 사용량", value: "0GB / 5GB", href: null },
];

const dashboardSections = [
  {
    title: "통계 / 대시보드",
    items: [
      { label: "통계 화면", description: "작지, 거래처, 생산 흐름, 첨부파일 사용량 지표 확인", href: null },
      { label: "운영 현황", description: "검토 대기, 발주 준비, 완료 흐름을 요약해서 확인", href: null },
    ],
  },
  {
    title: "작업 관리",
    items: [
      { label: "작지 워크스페이스", description: "현재 작업지시서 목록과 상세 화면으로 이동", href: "/worker" },
      { label: "작지 히스토리", description: "상태 변경과 주요 작업 기록 확인", href: "/admin/history" },
      { label: "검토 대기 작지", description: "검토가 필요한 작업지시서 확인", href: "/worker" },
    ],
  },
  {
    title: "기준정보 관리",
    items: [
      { label: "거래처 / 공장 관리", description: "공장, 원단, 부자재, 외주처 정보 관리", href: "/admin/partners" },
      { label: "단위 관리", description: "원단, 부자재, 생산 수량에 사용할 단위 기준 관리", href: null },
    ],
  },
  {
    title: "파일 / 용량 관리",
    items: [
      { label: "첨부파일 목록", description: "작지별 첨부파일과 대표 이미지 확인", href: null },
      { label: "휴지통", description: "소프트 삭제된 첨부파일 복원 또는 보관 상태 확인", href: null },
      { label: "용량 사용량", description: "첨부파일 저장소 사용량과 추가 요청 관리", href: null },
    ],
  },
  {
    title: "사용자 관리",
    items: [
      { label: "사용자 목록", description: "고객사 사용자와 활성 상태 확인", href: null },
      { label: "초대 / 권한", description: "사용자 초대와 역할 변경 관리", href: null },
      { label: "운영 로그", description: "관리자 작업 이력 확인", href: null },
    ],
  },
];

function DashboardItem({ item }: { item: { label: string; description: string; href: string | null } }) {
  const className = "group rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-300 hover:bg-stone-50";
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">{item.label}</h3>
        <span className="text-xs text-stone-400">{item.href ? "이동" : "준비중"}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-stone-500">{item.description}</p>
    </>
  );

  if (!item.href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">관리자 운영 화면</h1>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <AdminWorkspaceTools />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {summaryCards.map((card) => {
            const content = (
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:bg-stone-50">
                <p className="text-xs font-medium text-stone-500">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{card.value}</p>
              </div>
            );

            if (!card.href) {
              return <div key={card.label}>{content}</div>;
            }

            return (
              <Link key={card.label} href={card.href}>
                {content}
              </Link>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {dashboardSections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">{section.title}</h2>
              <div className="mt-4 grid gap-3">
                {section.items.map((item) => (
                  <DashboardItem key={item.label} item={item} />
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
