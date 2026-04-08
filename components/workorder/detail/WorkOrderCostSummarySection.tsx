import SummaryCard from "@/components/common/ui/SummaryCard";
import type { Outsourcing } from "@/types/workorder";

type WorkOrderCostSummarySectionProps = {
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
  outsourcing: Outsourcing[];
};

export default function WorkOrderCostSummarySection({
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  outsourcing,
}: WorkOrderCostSummarySectionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SummaryCard title="비용 요약">
        <div className="space-y-3 text-sm">
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">원단 합계</span><span className="font-medium text-stone-900">{fabricTotal.toLocaleString()}원</span></div>
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">부자재 합계</span><span className="font-medium text-stone-900">{subsidiaryTotal.toLocaleString()}원</span></div>
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">외주 합계</span><span className="font-medium text-stone-900">{outsourcingTotal.toLocaleString()}원</span></div>
          <div className="border-t border-stone-200 pt-3">
            <div className="flex min-w-0 items-center justify-between gap-4"><span className="font-semibold text-stone-900">총합</span><span className="font-semibold text-stone-900">{totalCost.toLocaleString()}원</span></div>
            <div className="mt-3 flex items-center justify-between gap-4"><span className="text-stone-600">장당 추정 원가</span><span className="font-medium text-stone-900">{unitCost.toLocaleString()}원</span></div>
          </div>
        </div>
      </SummaryCard>
      <SummaryCard title="공정별 금액">
        <div className="space-y-2 text-sm">
          {outsourcing.length > 0 ? outsourcing.map((item, index) => (
            <div key={`${item.id ?? item.process}-${index}`} className="flex min-w-0 items-center justify-between gap-4">
              <span className="text-stone-600">{item.process || `공정 ${index + 1}`}</span>
              <span className="font-medium text-stone-900">{(item.totalCost ?? 0).toLocaleString()}원</span>
            </div>
          )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">표시할 외주 공정 금액이 없습니다.</div>}
        </div>
      </SummaryCard>
    </div>
  );
}
