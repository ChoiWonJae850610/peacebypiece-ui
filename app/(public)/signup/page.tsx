import Link from "next/link";

import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
  GoogleMark,
} from "@/components/public/ATypePublicFrame";

export const dynamic = "force-dynamic";

export default function PublicSignupPage() {
  return (
    <ATypePublicFrame
      eyebrow="WAFL Trial"
      title={
        <>
          7일 무료로
          <br />
          WAFL 시작하기
        </>
      }
      description="Google 인증, 필수 동의, 사업자등록증, 사용할 요금제를 제출하면 WAFL 검토와 승인 후 Trial이 시작됩니다."
      heroItems={["7일 Trial", "100MB", "멤버 3명", "승인 후 시작"]}
      footer={
        <p>
          이미 초대를 받았다면 초대 링크를 사용해 주세요. 공개 가입은 신규 회사 Trial 신청 전용입니다.
        </p>
      }
    >
      <ATypePublicCard
        eyebrow="신규 회사 가입"
        title="Google 인증으로 신청서를 작성하세요"
        description="카드 번호는 WAFL에 저장하지 않습니다. 결제수단은 승인 전 안전한 참조 정보로만 준비되며, 실제 결제는 Trial 종료 시점의 정책에 따라 처리됩니다."
      >
        <ATypePublicNotice tone="info">
          Trial 승인 전 결제수단 준비가 필요합니다. 지금 결제되는 금액은 0원이며, Trial 종료 예정일과 선택한 요금제를 신청 화면에서 확인할 수 있습니다.
        </ATypePublicNotice>
        <a
          href="/api/auth/google/start?intent=signup"
          className="flex w-full items-center justify-center gap-3 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-5 py-4 text-sm font-black text-[var(--pbp-action-primary-text)] shadow-[var(--pbp-shadow-elevated-a-type)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-action-primary-surface-hover)]"
        >
          <GoogleMark />
          Google로 가입 신청 시작
        </a>
        <div className="grid gap-3 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)] sm:grid-cols-3">
          <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
            <p className="font-black text-[var(--pbp-text-primary)]">1. 신청</p>
            <p className="mt-1">이메일 인증, 동의, 사업자 정보, 증빙 파일, 유료 요금제를 선택합니다.</p>
          </div>
          <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
            <p className="font-black text-[var(--pbp-text-primary)]">2. 검토</p>
            <p className="mt-1">WAFL이 입력 정보와 사업자등록증을 확인합니다.</p>
          </div>
          <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
            <p className="font-black text-[var(--pbp-text-primary)]">3. Trial</p>
            <p className="mt-1">승인 시점부터 7일, 100MB, 3명으로 시작합니다.</p>
          </div>
        </div>
        <p className="text-center text-sm font-semibold text-[var(--pbp-text-muted)]">
          기존 계정은{" "}
          <Link href="/login" className="text-[var(--pbp-brand-primary)]">
            로그인
          </Link>
          으로 이동하세요.
        </p>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
