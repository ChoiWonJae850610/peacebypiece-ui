import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
} from "@/components/public/ATypePublicFrame";
import { resolveInviteAuthErrorMessage } from "@/lib/invitations/invitationErrorPresentation";

type InviteErrorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readError(params: Record<string, string | string[] | undefined>): string {
  const value = params.error;
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === "string" && firstValue.trim() ? firstValue.trim() : "INVITATION_ERROR";
}

export default async function InviteErrorPage({ searchParams }: InviteErrorPageProps) {
  const params = (await searchParams) || {};
  const error = readError(params);

  return (
    <ATypePublicFrame
      eyebrow="초대 오류"
      title={
        <>
          초대 링크를
          <br />
          열 수 없습니다.
        </>
      }
      description="초대 링크가 만료되었거나 로그인 처리 중 필요한 정보가 누락되었습니다."
      heroItems={["초대 링크", "만료 상태", "로그인 확인", "재요청"]}
      footer={<p>초대 링크가 필요하면 관리자에게 새 링크 생성을 요청해 주세요.</p>}
    >
      <ATypePublicCard eyebrow="초대 오류" title="링크 상태를 확인해 주세요.">
        <ATypePublicNotice tone="danger">{resolveInviteAuthErrorMessage(error)}</ATypePublicNotice>
        <a
          href="/login"
          className="flex w-full items-center justify-center rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-5 py-4 text-sm font-black text-[var(--pbp-text-primary)] transition hover:bg-[var(--pbp-surface-soft)]"
        >
          로그인 화면으로 이동
        </a>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
