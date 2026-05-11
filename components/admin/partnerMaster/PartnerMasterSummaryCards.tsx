"use client";

import type { PartnerSummaryViewModel } from "@/lib/admin/partner";

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
  className = "mt-3",
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

  return (
    <section className={`${className} shrink-0`} aria-label="협력업체 요약">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-3xl border px-4 py-3 shadow-sm ${card.tone}`}>
            <p className="text-xs font-semibold text-stone-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">{formatCount(card.value)}</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">{card.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
