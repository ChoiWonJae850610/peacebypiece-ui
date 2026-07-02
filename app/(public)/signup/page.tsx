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
      description="Google 인증, 필수 동의, 사업자등록증, 사용할 요금제를 제출하면 system-admin 검토와 승인 후 Trial이 시작됩니다."
      heroItems={["7일 Trial", "100MB", "멤버 3명", "승인 후 시작"]}
      footer={
        <p>
          이미 초대를 받았다면 초대 링크를 사용하세요. 공개 가입은 신규 회사 Trial 요청 전용입니다.
        </p>
      }
    >
      <ATypePublicCard
        eyebrow="신규 회사 가입"
        title="Google 인증으로 요청서를 작성하세요"
        description="카드 원문은 수집하지 않습니다. 실제 PG가 연결되기 전까지 production 결제수단 준비는 안전하게 blocked/deferred 상태로 처리합니다."
      >
        <ATypePublicNotice tone="info">
          Trial 승인 전 결제수단 readiness가 필요합니다. dev/test QA에서는 system-admin이 fake readiness를 부여할 수 있고,
          production에서는 실제 PG 연동 전까지 가짜 결제수단을 허용하지 않습니다.
        </ATypePublicNotice>
        <a
          href="/api/auth/google/start?intent=signup"
          className="flex w-full items-center justify-center gap-3 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-5 py-4 text-sm font-black text-[var(--pbp-action-primary-text)] shadow-[var(--pbp-shadow-elevated-a-type)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-action-primary-surface-hover)]"
        >
          <GoogleMark />
          Google로 가입 요청 시작
        </a>
        <div className="grid gap-3 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)] sm:grid-cols-3">
          <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
            <p className="font-black text-[var(--pbp-text-primary)]">1. 요청</p>
            <p className="mt-1">이메일 인증, 동의, 사업자 정보, 증빙 파일, 유료 요금제 선택</p>
          </div>
          <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
            <p className="font-black text-[var(--pbp-text-primary)]">2. 검토</p>
            <p className="mt-1">system-admin이 증빙과 consent evidence를 확인</p>
          </div>
          <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
            <p className="font-black text-[var(--pbp-text-primary)]">3. Trial</p>
            <p className="mt-1">승인 시점부터 7일, 100MB, 3명으로 시작</p>
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
