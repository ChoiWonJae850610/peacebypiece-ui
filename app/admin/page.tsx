import Link from "next/link";
import { APP_VERSION } from "@/lib/constants/app";

const adminSections = [
  {
    title: "통계",
    description: "상태별 집계, 최근 변경, 병목 구간 요약을 배치할 영역",
  },
  {
    title: "사용자",
    description: "초대, 역할 변경, 활성 사용자 관리 화면으로 확장할 영역",
  },
  {
    title: "설정",
    description: "알림, 기본값, 운영 설정을 정리할 영역",
  },
] as const;

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">PeaceByPiece Admin</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">관리자 페이지 기본 라우트</h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
                이 페이지는 관리자 대시보드, 사용자 관리, 운영 설정을 분리해서 붙이기 위한 기본 엔트리다.
                이번 단계에서는 라우트 구조와 페이지 골격만 준비한다.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <Link
                href="/worker"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                작업지시서 워크스페이스로 이동
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {adminSections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-stone-900">{section.title}</h2>
                <p className="text-sm leading-6 text-stone-600">{section.description}</p>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                  다음 단계에서 실제 화면과 데이터 연결 예정
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
