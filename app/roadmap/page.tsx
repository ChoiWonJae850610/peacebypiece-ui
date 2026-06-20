import { notFound, redirect } from "next/navigation";

import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { WaflLinkButton, WaflSurface } from "@/components/common/ui";
import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import {
  PRODUCTIZATION_ROADMAP,
  type ProductizationRoadmapImpact,
  type ProductizationRoadmapStatus,
} from "@/lib/internal/productizationRoadmap";

export const dynamic = "force-dynamic";

const statusTone: Record<ProductizationRoadmapStatus, AdminStatusBadgeTone> = {
  completed: "success",
  in_progress: "info",
  planned: "neutral",
  verification_pending: "warning",
  user_test_needed: "warning",
  user_decision_needed: "danger",
  paused: "maintenance",
  canceled: "danger",
};

const impactLabels: Record<ProductizationRoadmapImpact, string> = {
  none: "영향 없음",
  read_only: "조회 전용",
  guarded: "guard 유지",
  pending_decision: "결정 필요",
};

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <AdminStatusBadge tone={value ? "warning" : "success"} size="xs">
      {value ? "있음" : "없음"}
    </AdminStatusBadge>
  );
}

function ImpactBadge({ value }: { value: ProductizationRoadmapImpact }) {
  const tone: AdminStatusBadgeTone = value === "none" ? "success" : value === "pending_decision" ? "warning" : "info";
  return (
    <AdminStatusBadge tone={tone} size="xs">
      {impactLabels[value]}
    </AdminStatusBadge>
  );
}

function InlineList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-[var(--pbp-text-subtle)]">없음</span>;
  }

  return <span>{values.join(" · ")}</span>;
}

const roadmapStatusOrder: ProductizationRoadmapStatus[] = [
  "completed",
  "in_progress",
  "planned",
  "verification_pending",
  "user_test_needed",
  "user_decision_needed",
  "paused",
  "canceled",
];

export default async function ProductizationRoadmapPage() {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    redirect("/?error=SESSION_REQUIRED");
  }
  if (!(await isActiveSystemAdminSession(actualSession))) {
    notFound();
  }

  const roadmap = PRODUCTIZATION_ROADMAP;
  const pendingDecisionCount = roadmap.versions.filter((item) => item.status === "user_decision_needed").length;
  const verificationCount = roadmap.versions.filter((item) => item.status === "verification_pending").length;

  return (
    <main className="min-h-screen bg-[var(--pbp-surface-soft)] px-4 py-6 text-[var(--pbp-text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <WaflPageHero
          eyebrow="시스템 관리자"
          title="제품화 로드맵"
          description="버전별 개발 계획과 검증 상태를 확인합니다. 이 화면은 시스템 관리자 전용 조회 화면이며 저장, 수정, 삭제 기능을 제공하지 않습니다."
          badges={
            <>
              <AdminStatusBadge tone="brand">v{roadmap.appVersion}</AdminStatusBadge>
              <AdminStatusBadge tone="info">현재 작업 {roadmap.currentWorkVersion}</AdminStatusBadge>
            </>
          }
          actions={
            <WaflLinkButton href="/id-control" variant="secondary" size="sm">
              개발 제어센터로 돌아가기
            </WaflLinkButton>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">현재 앱 버전</p>
              <p className="mt-2 text-2xl font-bold">{roadmap.appVersion}</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">앱 기능 개발 진척도</p>
              <p className="mt-2 text-2xl font-bold">{roadmap.featureProgressPercent}%</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">제품화 진척도</p>
              <p className="mt-2 text-2xl font-bold">{roadmap.productizationProgressPercent}%</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">현재 작업 버전</p>
              <p className="mt-2 text-2xl font-bold">{roadmap.currentWorkVersion}</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">검증 대기</p>
              <p className="mt-2 text-2xl font-bold">{verificationCount}</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">사용자 결정 필요</p>
              <p className="mt-2 text-2xl font-bold">{pendingDecisionCount}</p>
            </WaflSurface>
          </div>
        </WaflPageHero>

        <WaflSectionPanel
          eyebrow="기준 데이터"
          title="로드맵 데이터 관리 기준"
          description={roadmap.canonicalPolicy}
          meta={<AdminStatusBadge tone="success">조회 전용</AdminStatusBadge>}
        >
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <WaflSurface shape="control" tone="muted" className="p-4">
              <p className="font-semibold">구조화 데이터</p>
              <p className="mt-1 text-[var(--pbp-text-muted)]">lib/internal/productizationRoadmap.ts</p>
            </WaflSurface>
            <WaflSurface shape="control" tone="muted" className="p-4">
              <p className="font-semibold">사람용 문서</p>
              <p className="mt-1 text-[var(--pbp-text-muted)]">docs/productization-roadmap.md</p>
            </WaflSurface>
            <WaflSurface shape="control" tone="muted" className="p-4">
              <p className="font-semibold">쓰기 정책</p>
              <p className="mt-1 text-[var(--pbp-text-muted)]">화면에서는 DB/R2 write와 편집 action을 제공하지 않음</p>
            </WaflSurface>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {roadmapStatusOrder.map((status) => (
              <AdminStatusBadge key={status} tone={statusTone[status]} size="xs">
                {roadmap.statusLabels[status]}
              </AdminStatusBadge>
            ))}
          </div>
        </WaflSectionPanel>

        <WaflSectionPanel
          eyebrow="버전 계획"
          title="버전별 계획"
          description="완료, 진행 중, 예정, 검증 대기, 사용자 테스트/결정 필요 상태를 한 화면에서 확인합니다."
        >
          {roadmap.versions.length === 0 ? (
            <WaflSurface shape="control" tone="empty" className="p-5 text-center text-sm text-[var(--pbp-text-muted)]">
              등록된 로드맵 항목이 없습니다.
            </WaflSurface>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--pbp-border)] text-xs font-semibold text-[var(--pbp-text-muted)]">
                      <th className="px-3 py-3">대상 버전</th>
                      <th className="px-3 py-3">현재 상태</th>
                      <th className="px-3 py-3">작업 내용</th>
                      <th className="px-3 py-3">우선순위</th>
                      <th className="px-3 py-3">관련 화면</th>
                      <th className="px-3 py-3">DB 마이그레이션</th>
                      <th className="px-3 py-3">권한 영향</th>
                      <th className="px-3 py-3">DB/R2 영향</th>
                      <th className="px-3 py-3">자동 테스트</th>
                      <th className="px-3 py-3">수동 테스트</th>
                      <th className="px-3 py-3">완료 commit</th>
                      <th className="px-3 py-3">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roadmap.versions.map((item) => (
                      <tr key={item.version} className="border-b border-[var(--pbp-border)] align-top last:border-0">
                        <td className="px-3 py-4 font-semibold">{item.version}</td>
                        <td className="px-3 py-4">
                          <AdminStatusBadge tone={statusTone[item.status]} size="xs">
                            {roadmap.statusLabels[item.status]}
                          </AdminStatusBadge>
                        </td>
                        <td className="max-w-[300px] px-3 py-4">
                          <p className="font-medium">{item.title}</p>
                          <ul className="mt-2 space-y-1 text-[var(--pbp-text-muted)]">
                            {item.workItems.slice(0, 5).map((workItem) => (
                              <li key={workItem}>- {workItem}</li>
                            ))}
                          </ul>
                          {item.workItems.length > 5 ? (
                            <p className="mt-1 text-xs text-[var(--pbp-text-subtle)]">외 {item.workItems.length - 5}개 항목</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-4">{item.priority}</td>
                        <td className="max-w-[150px] px-3 py-4"><InlineList values={item.relatedScreens} /></td>
                        <td className="px-3 py-4"><BooleanBadge value={item.dbMigration} /></td>
                        <td className="px-3 py-4"><ImpactBadge value={item.permissionImpact} /></td>
                        <td className="max-w-[180px] px-3 py-4">{item.dbR2Impact}</td>
                        <td className="max-w-[180px] px-3 py-4"><InlineList values={item.automaticTests} /></td>
                        <td className="max-w-[180px] px-3 py-4"><InlineList values={item.manualTests} /></td>
                        <td className="max-w-[160px] px-3 py-4"><InlineList values={item.completedCommits} /></td>
                        <td className="max-w-[220px] px-3 py-4 text-[var(--pbp-text-muted)]">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {roadmap.versions.map((item) => (
                  <article key={item.version} className="rounded-[8px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">{item.version}</p>
                        <h3 className="mt-1 text-base font-bold">{item.title}</h3>
                      </div>
                      <AdminStatusBadge tone={statusTone[item.status]} size="xs">
                        {roadmap.statusLabels[item.status]}
                      </AdminStatusBadge>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-[var(--pbp-text-muted)]">
                      {item.workItems.map((workItem) => (
                        <li key={workItem}>- {workItem}</li>
                      ))}
                    </ul>
                    <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                      <p>DB 마이그레이션<br /><BooleanBadge value={item.dbMigration} /></p>
                      <p>권한 영향<br /><ImpactBadge value={item.permissionImpact} /></p>
                      <p>DB/R2 영향<br />{item.dbR2Impact}</p>
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div><dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">우선순위</dt><dd>{item.priority}</dd></div>
                      <div><dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">관련 화면</dt><dd><InlineList values={item.relatedScreens} /></dd></div>
                      <div><dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">자동 테스트</dt><dd><InlineList values={item.automaticTests} /></dd></div>
                      <div><dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">수동 테스트</dt><dd><InlineList values={item.manualTests} /></dd></div>
                      <div><dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">완료 커밋</dt><dd><InlineList values={item.completedCommits} /></dd></div>
                      <div><dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">메모</dt><dd>{item.notes}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </WaflSectionPanel>
      </div>
    </main>
  );
}
