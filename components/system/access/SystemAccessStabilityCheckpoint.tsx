import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_ACCESS_CHECKPOINT_GROUPS,
  SYSTEM_ACCESS_CHECKPOINT_NEXT_ACTIONS,
  SYSTEM_ACCESS_CHECKPOINT_SUMMARY,
  type SystemAccessCheckpointStatus,
} from "@/lib/system/systemAccessStabilityCheckpoint";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";

function getStatusBadgeTone(status: SystemAccessCheckpointStatus): AdminStatusBadgeTone {
  if (status === "stable") {
    return "success";
  }

  if (status === "ready") {
    return "info";
  }

  if (status === "partial") {
    return "warning";
  }

  return "neutral";
}

export default function SystemAccessStabilityCheckpoint() {
  const totalCount = SYSTEM_ACCESS_CHECKPOINT_GROUPS.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const stableCount = SYSTEM_ACCESS_CHECKPOINT_GROUPS.reduce(
    (sum, group) =>
      sum + group.items.filter((item) => item.status === "stable").length,
    0,
  );
  const partialCount = SYSTEM_ACCESS_CHECKPOINT_GROUPS.reduce(
    (sum, group) =>
      sum + group.items.filter((item) => item.status === "partial").length,
    0,
  );

  const summaryCards = [
    {
      label: "점검 범위",
      value: SYSTEM_ACCESS_CHECKPOINT_SUMMARY.versionRange,
    },
    {
      label: "점검 항목",
      value: `${totalCount}개`,
    },
    {
      label: "화면 안정",
      value: `${stableCount}개`,
    },
    {
      label: "실제 연결 대기",
      value: `${partialCount}개`,
    },
  ];

  return (
    <SystemShell>
      <header className={SYSTEM_HEADER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className={SYSTEM_EYEBROW_CLASS}>SYSTEM ACCESS CHECKPOINT</p>
            <h1 className={SYSTEM_TITLE_CLASS}>
              {SYSTEM_ACCESS_CHECKPOINT_SUMMARY.title}
            </h1>
            <p className={SYSTEM_SUBTITLE_CLASS}>
              {SYSTEM_ACCESS_CHECKPOINT_SUMMARY.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <AdminStatusBadge tone="neutral">v{APP_VERSION}</AdminStatusBadge>
            <AdminLinkButton href="/system">시스템 홈</AdminLinkButton>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className={SYSTEM_CARD_CLASS}>
            <p className={SYSTEM_SMALL_TEXT_CLASS}>{card.label}</p>
            <p className={`mt-3 text-xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {SYSTEM_ACCESS_CHECKPOINT_GROUPS.map((group) => (
          <article key={group.id} className={SYSTEM_CARD_CLASS}>
            <div className={SYSTEM_SECTION_HEADER_CLASS}>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>{group.title}</h2>
              <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
                {group.description}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {group.items.map((item) => (
                <div key={item.id} className={SYSTEM_MUTED_CARD_CLASS}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                        {item.label}
                      </p>
                      <p className={`mt-1 ${SYSTEM_SMALL_TEXT_CLASS}`}>
                        {item.description}
                      </p>
                    </div>
                    <AdminStatusBadge tone={getStatusBadgeTone(item.status)}>
                      {item.statusLabel}
                    </AdminStatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-[var(--pbp-text-subtle)]">
                    <span className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2.5 py-1">
                      owner: {item.owner}
                    </span>
                    {item.route ? (
                      <AdminLinkButton
                        href={item.route}
                        variant="ghost"
                        size="sm"
                        className="min-h-0 px-2.5 py-1 text-[11px] underline underline-offset-4"
                      >
                        {item.route}
                      </AdminLinkButton>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className={SYSTEM_CARD_CLASS}>
        <div className="flex flex-col gap-2 border-b border-[var(--pbp-border)] pb-4">
          <h2 className={SYSTEM_SECTION_TITLE_CLASS}>다음 실제 연결 후보</h2>
          <p className={SYSTEM_BODY_TEXT_CLASS}>
            0.10.70은 안정화 체크포인트이므로 신규 저장 동작을 만들지 않고, 다음 실제 연결 범위를 분리합니다.
          </p>
        </div>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {SYSTEM_ACCESS_CHECKPOINT_NEXT_ACTIONS.map((action, index) => (
            <li key={action} className={`${SYSTEM_MUTED_CARD_CLASS} text-sm`}>
              <span className={`mr-2 font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                {index + 1}.
              </span>
              {action}
            </li>
          ))}
        </ol>
      </section>
    </SystemShell>
  );
}
