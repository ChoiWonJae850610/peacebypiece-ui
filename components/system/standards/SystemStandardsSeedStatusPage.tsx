import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { APP_VERSION } from "@/lib/constants/app";
import type { SystemStandardsSeedStatus } from "@/lib/system/standards/seedStatusRepository";

function statusTone(ready: boolean): AdminStatusBadgeTone {
  return ready ? "success" : "warning";
}

function statusPanelClassName(ready: boolean) {
  return ready
    ? "rounded-[24px] border border-[var(--pbp-status-success)] bg-[var(--pbp-status-success-soft)] p-5 text-[var(--pbp-status-success)] shadow-sm sm:rounded-3xl"
    : "rounded-[24px] border border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] p-5 text-[var(--pbp-status-warning)] shadow-sm sm:rounded-3xl";
}

export default function SystemStandardsSeedStatusPage({ seedStatus }: { seedStatus: SystemStandardsSeedStatus }) {
  return (
    <SystemShell>
      <header className={SYSTEM_HEADER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className={SYSTEM_EYEBROW_CLASS}>SYSTEM STANDARDS SEED</p>
            <h1 className={SYSTEM_TITLE_CLASS}>기준정보 seed 상태</h1>
            <p className={SYSTEM_SUBTITLE_CLASS}>
              기준정보 화면은 0.10.46부터 DB 결과만 사용합니다. 이 화면에서 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿의 seed 적용 상태를 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
            <AdminLinkButton href="/system/standards">기준정보 관리</AdminLinkButton>
            <AdminLinkButton href="/system/standards/regression">회귀점검</AdminLinkButton>
            <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
          </div>
        </div>
      </header>

      <section className={statusPanelClassName(seedStatus.ready)}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
          {seedStatus.mode === "db" ? "DB MODE" : "DB UNAVAILABLE"}
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          {seedStatus.ready ? "seed 준비 완료" : "seed 확인 필요"}
        </h2>
        <p className="mt-2 text-sm leading-6">{seedStatus.message}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {seedStatus.items.map((item) => (
          <article key={item.id} className={SYSTEM_CARD_CLASS}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{item.tableName}</p>
                <h2 className={`mt-2 ${SYSTEM_SECTION_TITLE_CLASS}`}>{item.label}</h2>
                <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>{item.description}</p>
              </div>
              <AdminStatusBadge tone={statusTone(item.ready)}>
                {item.ready ? "준비됨" : "비어 있음"}
              </AdminStatusBadge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={SYSTEM_MUTED_CARD_CLASS}>
                <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">전체 항목</p>
                <p className={`mt-2 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{item.count}개</p>
              </div>
              <div className={SYSTEM_MUTED_CARD_CLASS}>
                <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">활성 항목</p>
                <p className={`mt-2 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{item.activeCount}개</p>
                <p className="mt-1 text-[11px] font-medium text-[var(--pbp-text-subtle)]">최소 기준 {item.minimumActiveCount}개</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] p-5 text-sm leading-6 text-[var(--pbp-status-warning)] shadow-sm sm:rounded-3xl">
        <h2 className="text-base font-semibold">seed가 비어 있거나 최소 기준보다 부족할 때</h2>
        <ul className="mt-3 space-y-2">
          <li>· 기존 개발 DB를 유지하려면 db/schema/patch_0_10_48_system_standards_seed_refresh.sql을 실행합니다.</li>
          <li>· 개발 DB를 리셋할 수 있으면 db/schema/full_reset.sql 실행 후 full_reset_smoke_test.sql을 실행합니다.</li>
          <li>· 0.10.46부터 fallback은 기준정보 숫자와 선택지에 섞지 않습니다. seed가 부족하면 고객관리자 환경설정과 작업지시서 선택지는 빈 상태 또는 부족한 상태로 보입니다.</li>
        </ul>
        <div className="mt-4 rounded-2xl border border-[var(--pbp-status-warning)] bg-[var(--pbp-surface)]/80 px-4 py-3 font-mono text-xs">
          db/schema/patch_0_10_48_system_standards_seed_refresh.sql
        </div>
      </section>
    </SystemShell>
  );
}
