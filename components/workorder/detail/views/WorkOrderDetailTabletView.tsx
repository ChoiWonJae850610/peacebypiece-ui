import type { ReturnTypeBuildWorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailTabletView({
  viewModel,
}: {
  viewModel: ReturnTypeBuildWorkOrderDetailViewModel;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="text-base font-semibold text-stone-900">{viewModel.headerProps.title}</div>
        <div className="mt-2 text-sm text-stone-500">태블릿 전용 상세 뷰 구조 분리 완료. 현재 단계에서는 섹션 배치 스켈레톤만 유지합니다.</div>
      </section>

      <div className="mt-5 grid gap-4">
        <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
          <div className="text-sm font-medium text-stone-800">작업 액션 영역</div>
        </section>

        {viewModel.showCostSummary ? (
          <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <div className="text-sm font-medium text-stone-800">비용 요약 영역</div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
          <div className="text-sm font-medium text-stone-800">발주 정보 영역</div>
        </section>

        {viewModel.showProductionComposition ? (
          <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <div className="text-sm font-medium text-stone-800">생산 구성 영역</div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
