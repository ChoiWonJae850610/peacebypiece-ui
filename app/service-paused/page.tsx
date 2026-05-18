import { APP_VERSION } from "@/lib/constants/app";

export const dynamic = "force-dynamic";

export default function ServicePausedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-100 px-5 py-10 text-stone-900">
      <section className="w-full max-w-xl rounded-[32px] border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-500">WAFL v{APP_VERSION}</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">서비스 이용 대기 중입니다.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          회사의 가입 신청이 거절되었거나 무료체험 기간이 종료되어 이용 상태 확인이 필요합니다. 일반 멤버 계정에서는 상태 변경이나 요금제 변경을 처리할 수 없습니다.
        </p>
        <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
          가입 신청이 거절된 경우 시스템관리자에게 문의해 주세요. 무료체험 만료 또는 결제 상태 문제인 경우 고객사 관리자에게 요금제 갱신 또는 서비스 재개 요청을 문의해 주세요.
        </div>
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
