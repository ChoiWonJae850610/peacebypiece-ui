import MobileSectionStack from "@/components/workorder/detail/layout/MobileSectionStack";
import DevicePlaceholderSection from "@/components/workorder/detail/sections/shared/DevicePlaceholderSection";
import type { ReturnTypeBuildWorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailMobileView({
  viewModel,
}: {
  viewModel: ReturnTypeBuildWorkOrderDetailViewModel;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="text-sm font-semibold text-stone-900">{viewModel.headerProps.title}</div>
        <div className="mt-2 text-xs text-stone-500">모바일 전용 상세 레이아웃과 섹션 진입점 분리를 유지합니다. 세부 기능 UI는 이후 단계에서 모바일 전용으로 옮깁니다.</div>
      </section>

      <div className="mt-4">
        <MobileSectionStack>
          <DevicePlaceholderSection title="작업 액션 영역" compact />
          {viewModel.showCostSummary ? <DevicePlaceholderSection title="비용 요약 영역" compact /> : null}
          <DevicePlaceholderSection title="발주 정보 영역" compact />
          {viewModel.showProductionComposition ? <DevicePlaceholderSection title="생산 구성 영역" compact /> : null}
        </MobileSectionStack>
      </div>
    </div>
  );
}
