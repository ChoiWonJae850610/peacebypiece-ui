"use client";

import type { PartnerSummaryViewModel } from "@/lib/admin/partner";
import { PARTNER_TYPE_META } from "@/lib/admin/partner/constants";

type PartnerMasterSummaryCardsProps = {
  summary: PartnerSummaryViewModel;
  filteredSummary: PartnerSummaryViewModel;
  hasFilter: boolean;
  className?: string;
};

type SummaryCard = {
  label: string;
  value: number;
  helper: string;
  tone: string;
};

function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}

export default function PartnerMasterSummaryCards({
  summary,
  filteredSummary,
  hasFilter,
  className = "mt-5",
}: PartnerMasterSummaryCardsProps) {
  const source = hasFilter ? filteredSummary : summary;
  const cards: SummaryCard[] = [
    {
      label: "전체 업체",
      value: source.total,
      helper: hasFilter ? `전체 ${formatCount(summary.total)}개 중 현재 조건` : "등록된 협력업체",
      tone: "border-stone-200 bg-white",
    },
    {
      label: "사용중",
      value: source.active,
      helper: `미사용 ${formatCount(source.inactive)}개`,
      tone: "border-teal-100 bg-teal-50/70",
    },
    {
      label: "공장",
      value: source.typeCounts.factory,
      helper: "생산 발주 대상",
      tone: "border-sky-100 bg-sky-50/70",
    },
    {
      label: "원단/부자재",
      value: source.typeCounts.material_vendor + source.typeCounts.subsidiary_vendor,
      helper: `원단 ${formatCount(source.typeCounts.material_vendor)} · 부자재 ${formatCount(source.typeCounts.subsidiary_vendor)}`,
      tone: "border-emerald-100 bg-emerald-50/70",
    },
    {
      label: "외주",
      value: source.typeCounts.outsourcing_vendor,
      helper: `연결 공정 ${formatCount(source.outsourcingProcessCount)}개`,
      tone: "border-violet-100 bg-violet-50/70",
    },
  ];

  const distribution = [
    { key: "factory", label: PARTNER_TYPE_META.factory.shortLabel, value: source.typeCounts.factory, tone: PARTNER_TYPE_META.factory.tone },
    { key: "material_vendor", label: PARTNER_TYPE_META.material_vendor.shortLabel, value: source.typeCounts.material_vendor, tone: PARTNER_TYPE_META.material_vendor.tone },
    { key: "subsidiary_vendor", label: PARTNER_TYPE_META.subsidiary_vendor.shortLabel, value: source.typeCounts.subsidiary_vendor, tone: PARTNER_TYPE_META.subsidiary_vendor.tone },
    { key: "outsourcing_vendor", label: PARTNER_TYPE_META.outsourcing_vendor.shortLabel, value: source.typeCounts.outsourcing_vendor, tone: PARTNER_TYPE_META.outsourcing_vendor.tone },
  ];

  return (
    <section className={`${className} space-y-3`} aria-label="협력업체 요약">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-3xl border px-4 py-4 shadow-sm ${card.tone}`}>
            <p className="text-xs font-semibold text-stone-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{formatCount(card.value)}</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">{card.helper}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-900">업체 유형 분포</p>
            <p className="mt-1 text-xs text-stone-500">공장, 원단, 부자재, 외주 업체를 한 화면에서 확인합니다.</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            {hasFilter ? "필터 결과 기준" : "전체 기준"}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {distribution.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/70 px-3 py-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}>{item.label}</span>
              <span className="text-sm font-semibold text-stone-900">{formatCount(item.value)}개</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
