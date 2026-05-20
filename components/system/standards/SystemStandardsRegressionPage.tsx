import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_CARD_CLASS,
  SYSTEM_CODE_INLINE_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { APP_VERSION } from "@/lib/constants/app";
import type {
  SystemStandardsRegressionCheck,
  SystemStandardsRegressionSnapshot,
} from "@/lib/system/standards/regressionRepository";

function statusTone(status: SystemStandardsRegressionCheck["status"]): AdminStatusBadgeTone {
  if (status === "pass") return "success";
  if (status === "warn") return "warning";
  return "danger";
}

function statusLabel(status: SystemStandardsRegressionCheck["status"]) {
  if (status === "pass") return "정상";
  if (status === "warn") return "주의";
  return "확인 필요";
}

function summaryPanelClassName(ready: boolean) {
  return ready
    ? "rounded-[24px] border border-[var(--pbp-status-success)] bg-[var(--pbp-status-success-soft)] p-5 text-[var(--pbp-status-success)] shadow-sm sm:rounded-3xl"
    : "rounded-[24px] border border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] p-5 text-[var(--pbp-status-warning)] shadow-sm sm:rounded-3xl";
}

export default function SystemStandardsRegressionPage({ snapshot }: { snapshot: SystemStandardsRegressionSnapshot }) {
  return (
    <SystemShell>
      <header className={SYSTEM_HEADER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className={SYSTEM_EYEBROW_CLASS}>SYSTEM STANDARDS REGRESSION</p>
            <h1 className={SYSTEM_TITLE_CLASS}>기준정보 DB-only 회귀 점검</h1>
            <p className={SYSTEM_SUBTITLE_CLASS}>
              단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿이 fallback 없이 DB 결과만 사용하는지 점검합니다.
              새로고침마다 수량이 흔들리는 문제를 추적할 때 이 화면과 API 응답을 기준으로 봅니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
            <AdminLinkButton href="/system/standards/seed-status">seed 상태</AdminLinkButton>
            <AdminLinkButton href="/system/standards">기준정보 관리</AdminLinkButton>
            <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
          </div>
        </div>
      </header>

      <section className={summaryPanelClassName(snapshot.ready)}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
          {snapshot.mode === "db" ? "DB ONLY" : "DB UNAVAILABLE"}
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          {snapshot.ready ? "회귀 점검 통과" : "회귀 점검 확인 필요"}
        </h2>
        <p className="mt-2 text-sm leading-6">{snapshot.summary}</p>
        <p className="mt-2 text-xs font-medium opacity-80">생성 시각: {snapshot.generatedAt}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {snapshot.checks.map((check) => (
          <article key={check.id} className={SYSTEM_CARD_CLASS}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={SYSTEM_SECTION_TITLE_CLASS}>{check.label}</h2>
                <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>{check.detail}</p>
              </div>
              <AdminStatusBadge tone={statusTone(check.status)}>
                {statusLabel(check.status)}
              </AdminStatusBadge>
            </div>
            <p className={`mt-4 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3 text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {check.valueLabel}
            </p>
          </article>
        ))}
      </section>

      <section className={`${SYSTEM_CARD_CLASS} ${SYSTEM_BODY_TEXT_CLASS}`}>
        <h2 className={`text-base font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>점검 기준</h2>
        <ul className="mt-3 space-y-2">
          <li>· 기준정보 화면과 작업지시서 선택지는 fallback을 사용하지 않고 DB 결과만 사용합니다.</li>
          <li>· 단위 표준과 외주공정 유형 수량은 시스템 원장 기준 전체 수와 고객사별 사용 수를 분리해서 봐야 합니다.</li>
          <li>· 생산품 유형 기본값 복원은 시스템관리자가 기본으로 지정한 활성 템플릿 1개를 기준으로 합니다.</li>
          <li>· 수량이 부족하면 db/schema/patch_0_10_48_system_standards_seed_refresh.sql을 먼저 실행합니다.</li>
        </ul>
        <div className={`mt-4 ${SYSTEM_CODE_INLINE_CLASS}`}>
          /api/system/standards/regression
        </div>
      </section>
    </SystemShell>
  );
}
