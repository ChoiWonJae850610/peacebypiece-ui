import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
  GoogleMark,
} from "@/components/public/ATypePublicFrame";

type WaflLoginPageProps = {
  error?: string | null;
};

function readLoginError(error?: string | null): string | null {
  if (!error) return null;
  if (error === "ACCOUNT_NOT_FOUND") return "아직 등록되지 않은 계정입니다. 초대를 받은 계정인지 확인해 주세요.";
  if (error === "DB_NOT_CONFIGURED") return "서비스 연결 상태를 확인하는 중 문제가 발생했습니다. 관리자에게 문의해 주세요.";
  if (error === "GOOGLE_OAUTH_CLIENT_ID_REQUIRED") return "Google 로그인을 시작할 수 없습니다. 관리자에게 문의해 주세요.";
  if (error === "GOOGLE_OAUTH_CLIENT_SECRET_REQUIRED") return "Google 로그인을 완료할 수 없습니다. 관리자에게 문의해 주세요.";
  if (error === "GOOGLE_OAUTH_STATE_MISMATCH") return "로그인 요청을 다시 시작해 주세요.";
  if (error === "WAFL_SESSION_SECRET_REQUIRED") return "로그인 상태를 저장할 수 없습니다. 관리자에게 문의해 주세요.";
  if (error === "GOOGLE_ACCOUNT_ALREADY_LINKED") return "이미 다른 Google 계정과 연결된 사용자입니다.";
  return "로그인 중 문제가 발생했습니다. 다시 시도해 주세요.";
}

export default function WaflLoginPage({ error }: WaflLoginPageProps) {
  const errorMessage = readLoginError(error);

  return (
    <ATypePublicFrame
      eyebrow="WAFL 로그인"
      title={
        <>
          업무를 연결하고,
          <br />
          협업을 완성하세요.
        </>
      }
      description="작업 배정부터 결과 관리까지 WAFL이 패션 생산의 흐름을 한 화면에서 연결합니다."
      heroItems={["작업지시서", "협력업체", "파일 관리", "생산 흐름"]}
      footer={<p>초대받은 계정 또는 승인된 계정으로 로그인해 주세요.</p>}
    >
      <ATypePublicCard
        eyebrow="WAFL 로그인"
        title="Google 계정으로 계속하세요."
        description="등록된 고객사 관리자와 승인된 멤버만 사용할 수 있습니다."
      >
        {errorMessage ? <ATypePublicNotice tone="danger">{errorMessage}</ATypePublicNotice> : null}

        <a
          href="/api/auth/google/start?requestType=login"
          className="flex w-full items-center justify-center gap-3 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-5 py-4 text-sm font-black text-[var(--pbp-action-primary-text)] shadow-[var(--pbp-shadow-elevated-a-type)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-action-primary-surface-hover)]"
        >
          <GoogleMark />
          Google로 계속하기
        </a>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
