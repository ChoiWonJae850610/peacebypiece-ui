type WaflLoginPageProps = {
  error?: string | null;
};

function WaffleGridMark() {
  return (
    <div aria-hidden="true" className="grid h-12 w-12 grid-cols-3 gap-1 rounded-2xl bg-[#B8742B] p-2 shadow-[inset_0_0_0_1px_rgba(62,39,18,0.22)]">
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className="rounded-[0.35rem] bg-[#FFE7A8] shadow-[inset_0_-1px_0_rgba(62,39,18,0.16)]"
        />
      ))}
    </div>
  );
}

function GoogleMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-black text-[#2B2118] shadow-sm">
      G
    </span>
  );
}

function readLoginError(error?: string | null): string | null {
  if (!error) return null;
  if (error === "ACCOUNT_NOT_FOUND") return "아직 WAFL에 등록된 계정이 아니에요.";
  if (error === "DB_NOT_CONFIGURED") return "데이터베이스 연결 설정이 필요해요.";
  if (error === "GOOGLE_OAUTH_CLIENT_ID_REQUIRED") return "Google 로그인 Client ID가 아직 연결되지 않았어요.";
  if (error === "GOOGLE_OAUTH_CLIENT_SECRET_REQUIRED") return "Google 로그인 보안 설정이 아직 연결되지 않았어요.";
  if (error === "GOOGLE_OAUTH_STATE_MISMATCH") return "로그인 요청을 다시 시작해 주세요.";
  if (error === "WAFL_SESSION_SECRET_REQUIRED") return "로그인 세션 보안 설정이 필요해요.";
  if (error === "GOOGLE_ACCOUNT_ALREADY_LINKED") return "이미 다른 Google 계정과 연결된 사용자예요.";
  return "로그인 중 문제가 생겼어요. 다시 시도해 주세요.";
}

export default function WaflLoginPage({ error }: WaflLoginPageProps) {
  const errorMessage = readLoginError(error);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF7E3] px-5 py-6 text-[#2A2016] sm:px-8 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.19] [background-image:linear-gradient(#D89B43_1px,transparent_1px),linear-gradient(90deg,#D89B43_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-[#F3C05E]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-8rem] h-96 w-96 rounded-full bg-[#9F6227]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between gap-8 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WaffleGridMark />
            <div>
              <p className="text-2xl font-black tracking-[-0.04em] text-[#2A2016]">WAFL</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9C6424]">
                Work Assignment Flow
              </p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.52fr)] lg:gap-16">
          <article className="max-w-3xl space-y-8 sm:space-y-10">
            <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.07em] text-[#2A2016] sm:text-6xl lg:text-7xl">
              오늘도
              <br />
              함께
              <br />
              시작해요.
            </h1>

            <div className="space-y-5 text-3xl font-black leading-tight tracking-[-0.04em] text-[#4A321C] sm:text-4xl lg:text-5xl">
              <p>
                <span className="inline-block rounded-[1.2rem] bg-[#FFE1A6]/85 px-3 py-1 text-[#7A4516] shadow-[0_12px_34px_rgba(184,116,43,0.2)] ring-1 ring-[#D89B43]/25 sm:px-4">
                  와플
                </span>
                에서.
              </p>
            </div>
          </article>

          <aside className="w-full rounded-[2rem] border border-[#E1AF68]/60 bg-[#FFFDF7]/75 p-5 shadow-[0_24px_70px_rgba(89,53,18,0.14)] backdrop-blur sm:p-6 lg:p-7">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-black text-[#9C6424]">WAFL 로그인</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#2A2016]">
                  Google 계정으로 계속하세요.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#7D5C38]">
                  등록된 고객사 멤버만 사용할 수 있어요.
                </p>
              </div>

              {errorMessage ? (
                <div className="rounded-3xl border border-[#E08A70]/70 bg-[#FFF1EA] px-5 py-4 text-sm font-bold text-[#9B3F24]">
                  {errorMessage}
                </div>
              ) : null}

              <a
                href="/api/auth/google/start?requestType=login"
                className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-[#2A2016] px-5 py-4 text-sm font-black text-[#FFF8E7] shadow-[0_14px_30px_rgba(72,42,16,0.22)] transition hover:-translate-y-0.5 hover:bg-[#3A2A1B]"
              >
                <GoogleMark />
                Google로 계속하기
              </a>
            </div>
          </aside>
        </div>

        <footer className="relative text-xs font-semibold leading-5 text-[#8B6A45]">
          <p>WAFL은 초대받은 멤버만 로그인할 수 있습니다.</p>
        </footer>
      </section>
    </main>
  );
}
