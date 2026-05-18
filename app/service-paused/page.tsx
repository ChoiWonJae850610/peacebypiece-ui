import { APP_VERSION } from "@/lib/constants/app";

export const dynamic = "force-dynamic";

export default function ServicePausedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-100 px-5 py-10 text-stone-900">
      <section className="w-full max-w-xl rounded-[32px] border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-500">WAFL v{APP_VERSION}</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">서비스 이용 대기 중입니다.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          회사의 무료 체험 기간이 종료되었거나 이용 상태 확인이 필요합니다. 고객사 관리자에게 문의해 주세요.
        </p>
        <a
          href="/api/auth/logout"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-stone-900 px-5 text-sm font-bold text-white"
        >
          로그아웃
        </a>
      </section>
    </main>
  );
}
