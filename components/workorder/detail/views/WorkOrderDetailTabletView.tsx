import TabletSplitLayout from "@/components/workorder/detail/layout/TabletSplitLayout";
import DevicePlaceholderSection from "@/components/workorder/detail/sections/shared/DevicePlaceholderSection";
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
        <div className="mt-2 text-sm text-stone-500">태블릿 전용 상세 레이아웃과 섹션 진입점 분리를 유지합니다. 세부 기능 UI는 이후 단계에서 태블릿 전용으로 옮깁니다.</div>
      </section>

      <div className="mt-5">
        <TabletSplitLayout>
          <DevicePlaceholderSection title="작업 액션 영역" />
          {viewModel.showCostSummary ? <DevicePlaceholderSection title="비용 요약 영역" /> : null}
          <DevicePlaceholderSection title="발주 정보 영역" />
          {viewModel.showProductionComposition ? <DevicePlaceholderSection title="생산 구성 영역" /> : null}
        </TabletSplitLayout>
      </div>
    </div>
  );
}
