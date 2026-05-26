import { AdminCard, AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { buildMaterialOrderWorkspaceViewModel } from "@/lib/material-orders/materialOrderWorkspaceViewModel";

export default function MaterialOrderWorkspacePage() {
  const viewModel = buildMaterialOrderWorkspaceViewModel();

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="원단·부자재 발주 요약">
        {viewModel.summaryCards.map((item) => (
          <AdminCard key={item.id} className="min-h-[146px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight pbp-text-primary">{item.value}</p>
              </div>
              <AdminStatusBadge tone="neutral">준비중</AdminStatusBadge>
            </div>
            <p className="mt-4 text-xs leading-5 pbp-text-muted">{item.description}</p>
          </AdminCard>
        ))}
      </section>

      <AdminSection
        eyebrow="Material ordering"
        title="원단·부자재 발주 업무"
        description="작업지시서 필요량, 실제 발주 수량, 작업지시서별 배분 수량, 남은 재고 수량을 분리해 관리하는 업무 화면입니다. 현재 버전은 DB 저장 전 route shell/skeleton입니다."
        actions={<AdminStatusBadge tone="warning">Skeleton</AdminStatusBadge>}
        className="p-5"
        bodyClassName="mt-5"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {viewModel.tabs.map((tab) => (
            <AdminCard key={tab.id} as="article" className="min-h-[160px] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight pbp-text-primary">{tab.label}</h3>
                <AdminStatusBadge tone="neutral">{tab.statusLabel}</AdminStatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 pbp-text-muted">{tab.description}</p>
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminSection
          title="상태 흐름 초안"
          description="실제 저장/승인 로직은 다음 DB schema와 repository 단계에서 연결합니다."
          className="p-5"
          bodyClassName="mt-5"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {viewModel.processSteps.map((step, index) => (
              <div key={step.id} className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pbp-surface-soft)] text-xs font-semibold pbp-text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-semibold pbp-text-primary">{step.label}</p>
                </div>
                <p className="mt-3 text-xs leading-5 pbp-text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </AdminSection>

        <AdminSection
          title="자재 전달 요청서 확장 방향"
          description="발주 확정 후 공급처와 도착지 기준으로 외부 전달용 문서를 생성하는 방향입니다."
          className="p-5"
          bodyClassName="mt-5"
        >
          <div className="space-y-3">
            {viewModel.deliveryDocumentGroups.map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-3 text-sm leading-6 pbp-text-primary">
                {item}
              </div>
            ))}
          </div>
        </AdminSection>
      </div>
    </div>
  );
}
