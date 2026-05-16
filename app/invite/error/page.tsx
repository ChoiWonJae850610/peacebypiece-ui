type InviteErrorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readError(params: Record<string, string | string[] | undefined>): string {
  const value = params.error;
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === "string" && firstValue.trim() ? firstValue.trim() : "INVITATION_ERROR";
}

function readFriendlyError(error: string): string {
  if (error === "GOOGLE_OAUTH_CLIENT_ID_REQUIRED") return "Google 로그인 설정이 아직 연결되지 않았습니다.";
  if (error === "GOOGLE_OAUTH_CLIENT_SECRET_REQUIRED") return "Google 로그인 보안 설정이 아직 연결되지 않았습니다.";
  if (error === "INVITATION_TOKEN_REQUIRED") return "초대 토큰이 없는 링크입니다.";
  return "초대 링크 처리 중 문제가 발생했습니다.";
}

export default async function InviteErrorPage({ searchParams }: InviteErrorPageProps) {
  const params = (await searchParams) || {};
  const error = readError(params);

  return (
    <main className="grid min-h-screen place-items-center bg-[#FFF7E3] px-5 py-10 text-[#2A2016]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#E1AF68]/70 bg-white/80 p-7 shadow-[0_24px_70px_rgba(89,53,18,0.14)]">
        <p className="text-sm font-black tracking-[0.18em] text-[#9C6424]">WAFL</p>
        <h1 className="mt-4 text-2xl font-black tracking-[-0.04em]">초대장을 열 수 없어요.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#6F5030]">{readFriendlyError(error)}</p>
      </section>
    </main>
  );
}
