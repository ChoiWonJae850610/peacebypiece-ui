import type { AdminFileUsageCard, AdminStoragePolicyItem } from "@/lib/admin/adminFiles.types";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  policyItems: AdminStoragePolicyItem[];
};

export default function FileStorageSummary({ usageCards, policyItems }: FileStorageSummaryProps) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        {usageCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-stone-500">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">용량 / 휴지통 정책</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">첨부파일 삭제는 즉시 원본 삭제가 아니라 복구 가능한 보관 상태로 전환합니다.</p>
          </div>
          <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">DB 연결 예정</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {policyItems.map((item) => (
            <article key={item.label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium text-stone-500">{item.label}</p>
              <p className="mt-2 text-base font-semibold text-stone-900">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
