import type { ReactNode } from "react";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type WorkOrderDetailDesktopSectionsProps = {
  viewModel: WorkOrderDetailViewModel;
};

function DetailSectionGroup({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 min-w-0">
      <div className="mb-2.5 flex min-w-0 items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{eyebrow}</div>
          <h3 className="mt-1 text-sm font-semibold leading-5 text-stone-900">{title}</h3>
          <p className="mt-0.5 max-w-[44rem] text-[11px] leading-4 text-stone-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function WorkOrderDetailDesktopSections({ viewModel }: WorkOrderDetailDesktopSectionsProps) {
  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white px-5 py-5 shadow-sm">
        <WorkOrderHeaderSection {...viewModel.headerProps} />

        <WorkOrderActionSection {...viewModel.actionProps} />

      </div>

      {viewModel.showCostSummary ? (
        <DetailSectionGroup eyebrow="Cost" title="비용 요약" description="원단, 부자재, 외주, 공임, 로스 비용을 먼저 확인합니다.">
          <WorkOrderCostSummarySection {...viewModel.costSummaryProps} />
        </DetailSectionGroup>
      ) : null}

      <DetailSectionGroup eyebrow="Order" title="발주 정보" description="공장별 발주 수량, 납기일, 공임과 로스 비용을 관리합니다.">
        <OrderInfoSection {...viewModel.orderInfoProps} />
      </DetailSectionGroup>

      {viewModel.showProductionComposition ? (
        <DetailSectionGroup eyebrow="Production" title="생산 구성" description="원단, 부자재, 외주 공정의 구성과 비용을 한 곳에서 정리합니다.">
          <ProductionCompositionSection {...viewModel.productionCompositionProps} />
        </DetailSectionGroup>
      ) : null}
    </>
  );
}
