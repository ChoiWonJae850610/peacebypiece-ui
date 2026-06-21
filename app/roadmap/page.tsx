import { notFound, redirect } from "next/navigation";

import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { WaflLinkButton, WaflSurface } from "@/components/common/ui";
import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import {
  getRoadmapVersionAnchor,
  PRODUCTIZATION_ROADMAP,
  type ProductizationRoadmapImpact,
  type ProductizationRoadmapStatus,
  type ProductizationRoadmapVersion,
} from "@/lib/internal/productizationRoadmap";

export const dynamic = "force-dynamic";

const statusTone: Record<ProductizationRoadmapStatus, AdminStatusBadgeTone> = {
  planned: "neutral",
  in_progress: "info",
  implemented: "info",
  verification_pending: "warning",
  user_test_needed: "warning",
  user_decision_needed: "danger",
  completed: "success",
  paused: "maintenance",
  canceled: "danger",
};

const impactTone: Record<ProductizationRoadmapImpact, AdminStatusBadgeTone> = {
  none: "success",
  read_only: "info",
  guarded: "info",
  pending_decision: "warning",
};

const roadmapStatusOrder: ProductizationRoadmapStatus[] = [
  "planned",
  "in_progress",
  "implemented",
  "verification_pending",
  "user_test_needed",
  "user_decision_needed",
  "completed",
  "paused",
  "canceled",
];

function TextList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <p className="text-sm text-[var(--pbp-text-subtle)]">없음</p>;
  }

  return (
    <ul className="space-y-1.5 text-sm leading-6 text-[var(--pbp-text-muted)]">
      {values.map((value) => (
        <li key={value}>- {value}</li>
      ))}
    </ul>
  );
}

function DetailSection({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="rounded-[8px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
      <h4 className="text-sm font-bold text-[var(--pbp-text-primary)]">{title}</h4>
      <div className="mt-2">
        <TextList values={values} />
      </div>
    </section>
  );
}

function ImpactBadge({ value }: { value: ProductizationRoadmapImpact }) {
  const roadmap = PRODUCTIZATION_ROADMAP;
  return (
    <AdminStatusBadge tone={impactTone[value]} size="xs">
      {roadmap.impactLabels[value]}
    </AdminStatusBadge>
  );
}

function MigrationBadge({ value }: { value: boolean }) {
  return (
    <AdminStatusBadge tone={value ? "warning" : "success"} size="xs">
      {value ? "있음" : "없음"}
    </AdminStatusBadge>
  );
}

function RoadmapVersionCard({ item }: { item: ProductizationRoadmapVersion }) {
  const roadmap = PRODUCTIZATION_ROADMAP;
  const anchor = getRoadmapVersionAnchor(item.version);

  return (
    <article id={anchor} className="scroll-mt-6 rounded-[8px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone="brand" size="xs">
              {item.version}
            </AdminStatusBadge>
            <AdminStatusBadge tone={statusTone[item.status]} size="xs">
              {roadmap.statusLabels[item.status]}
            </AdminStatusBadge>
            {item.result.userConfirmationRequired ? (
              <AdminStatusBadge tone="warning" size="xs">
                사용자 확인 필요
              </AdminStatusBadge>
            ) : (
              <AdminStatusBadge tone="success" size="xs">
                사용자 확인 불필요
              </AdminStatusBadge>
            )}
          </div>
          <h3 className="mt-2 text-lg font-bold text-[var(--pbp-text-primary)]">{item.title}</h3>
          <div className="mt-3">
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">사용자 관점의 목적</p>
            <TextList values={item.userSummary} />
          </div>
        </div>
        <a className="text-sm font-semibold text-[var(--pbp-accent)] underline-offset-4 hover:underline" href={`#${anchor}`}>
          직접 링크
        </a>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <WaflSurface shape="control" tone="muted" className="p-4">
          <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">사용자에게 보이는 주요 변경</p>
          <div className="mt-2">
            <TextList values={item.visibleChanges} />
          </div>
        </WaflSurface>
        <WaflSurface shape="control" tone="muted" className="p-4">
          <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">UI가 어떻게 달라지는지</p>
          <div className="mt-2">
            <TextList values={item.expectedUi} />
          </div>
        </WaflSurface>
      </div>

      <details className="mt-4 rounded-[8px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
        <summary className="cursor-pointer text-sm font-bold text-[var(--pbp-text-primary)]">상세보기</summary>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          <DetailSection title="개발 목표" values={item.developmentPurpose} />
          <DetailSection title="사용자 관점 UI 기준" values={item.expectedUi} />
          <DetailSection title="개발 관점 UI 구조" values={item.developmentUiStructure} />
          <DetailSection title="작업 범위" values={item.scope} />
          <DetailSection title="제외 범위" values={item.outOfScope} />
          <DetailSection title="구현 원칙" values={item.implementationPrinciples} />
          <DetailSection title="성공 조건" values={item.successConditions} />
          <DetailSection title="실패 조건" values={item.failureConditions} />
          <DetailSection title="주의사항" values={item.cautions} />
          <DetailSection title="중단 조건" values={item.stopConditions} />
          <DetailSection title="권한 영향" values={item.permissionNotes} />
          <DetailSection title="DB 영향" values={item.dbImpactNotes} />
          <DetailSection title="R2 영향" values={item.r2ImpactNotes} />
          <section className="rounded-[8px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
            <h4 className="text-sm font-bold text-[var(--pbp-text-primary)]">Migration 여부</h4>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--pbp-text-muted)]">
              <MigrationBadge value={item.migrationRequired} />
              <span>{item.migrationNotes}</span>
            </div>
          </section>
          <DetailSection title="자동 테스트" values={item.automaticTests} />
          <DetailSection title="수동 테스트" values={item.manualTests} />
          <DetailSection title="예상 변경 영역" values={item.expectedChangeAreas} />
          <DetailSection title="완료 처리 조건" values={item.completionConditions} />
          <DetailSection title="완료 결과" values={item.result.completedSummary} />
          <section className="rounded-[8px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
            <h4 className="text-sm font-bold text-[var(--pbp-text-primary)]">commit 및 검증 결과</h4>
            <dl className="mt-2 space-y-2 text-sm text-[var(--pbp-text-muted)]">
              <div>
                <dt className="font-semibold text-[var(--pbp-text-primary)]">권장 commit message</dt>
                <dd>{item.recommendedCommitMessage}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--pbp-text-primary)]">완료 commit hash</dt>
                <dd>{item.result.commitHash || "미등록"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--pbp-text-primary)]">verification result</dt>
                <dd>{item.result.verificationResult || "미등록"}</dd>
              </div>
            </dl>
          </section>
          <DetailSection title="남은 문제" values={item.result.remainingIssues} />
          <DetailSection title="다음 버전 경계" values={item.nextVersionBoundary} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ImpactBadge value={item.permissionImpact} />
          <ImpactBadge value={item.dbImpact} />
          <ImpactBadge value={item.r2Impact} />
        </div>
      </details>
    </article>
  );
}

export default async function ProductizationRoadmapPage() {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    redirect("/?error=SESSION_REQUIRED");
  }
  if (!(await isActiveSystemAdminSession(actualSession))) {
    notFound();
  }

  const roadmap = PRODUCTIZATION_ROADMAP;
  const userConfirmationCount = roadmap.versions.filter((item) => item.result.userConfirmationRequired).length;
  const verificationCount = roadmap.versions.filter((item) => item.status === "verification_pending").length;

  return (
    <main className="min-h-screen bg-[var(--pbp-surface-soft)] px-4 py-6 text-[var(--pbp-text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <WaflPageHero
          eyebrow="시스템 관리자"
          title="제품화 로드맵"
          description="사용자에게 보이는 버전별 요약과 ChatGPT/Codex가 실제 개발 기준으로 사용하는 상세 명세를 함께 확인합니다. 이 화면은 시스템 관리자 전용 조회 화면이며 편집, 추가, 삭제, 저장 기능을 제공하지 않습니다."
          badges={
            <>
              <AdminStatusBadge tone="brand">v{roadmap.appVersion}</AdminStatusBadge>
              <AdminStatusBadge tone="info">현재 작업 {roadmap.currentWorkVersion}</AdminStatusBadge>
            </>
          }
          actions={
            <WaflLinkButton href="/id-control" variant="secondary" size="sm">
              개발 제어센터
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
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">다음 기준 버전</p>
              <p className="mt-2 text-2xl font-bold">{roadmap.nextWorkVersion}</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">검증 대기</p>
              <p className="mt-2 text-2xl font-bold">{verificationCount}</p>
            </WaflSurface>
            <WaflSurface shape="control" className="p-4">
              <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">사용자 확인 필요</p>
              <p className="mt-2 text-2xl font-bold">{userConfirmationCount}</p>
            </WaflSurface>
          </div>
        </WaflPageHero>

        <WaflSectionPanel
          eyebrow="기준 데이터"
          title="canonical roadmap"
          description={roadmap.canonicalPolicy}
          meta={<AdminStatusBadge tone="success">조회 전용</AdminStatusBadge>}
        >
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <WaflSurface shape="control" tone="muted" className="p-4">
              <p className="font-semibold">구조화 데이터</p>
              <p className="mt-1 text-[var(--pbp-text-muted)]">lib/internal/roadmap/index.ts</p>
            </WaflSurface>
            <WaflSurface shape="control" tone="muted" className="p-4">
              <p className="font-semibold">호환 facade</p>
              <p className="mt-1 text-[var(--pbp-text-muted)]">lib/internal/productizationRoadmap.ts</p>
            </WaflSurface>
            <WaflSurface shape="control" tone="muted" className="p-4">
              <p className="font-semibold">사람용 문서</p>
              <p className="mt-1 text-[var(--pbp-text-muted)]">docs/productization-roadmap.md</p>
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
          title="버전별 요약과 상세 개발 명세"
          description="기본 카드에는 사용자 관점의 변화만 먼저 보여주고, 상세보기에는 Codex가 실제 작업 계약으로 읽어야 하는 구현 기준과 검증 조건을 표시합니다."
        >
          {roadmap.versions.length === 0 ? (
            <WaflSurface shape="control" tone="empty" className="p-5 text-center text-sm text-[var(--pbp-text-muted)]">
              등록된 로드맵 항목이 없습니다.
            </WaflSurface>
          ) : (
            <div className="grid gap-4">
              {roadmap.versions.map((item) => (
                <RoadmapVersionCard key={item.version} item={item} />
              ))}
            </div>
          )}
        </WaflSectionPanel>
      </div>
    </main>
  );
}
