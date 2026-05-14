import { APP_RUNTIME_MODE, DEV_DEBUG_FLAGS } from "@/lib/runtime/runtimeMode";
import type { AdminHistoryEvent } from "@/lib/admin/history/types";

type Props = {
  historyEvents: AdminHistoryEvent[];
};

export default function AdminHistoryDebugPanel({ historyEvents }: Props) {
  const counts = historyEvents.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  const duplicateIds = Array.from(
    historyEvents.reduce<Map<string, number>>((acc, item) => {
      acc.set(item.id, (acc.get(item.id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()).entries(),
  )
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }))
    .slice(0, 5);

  return (
    <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">DEBUG</span>
        <h2 className="text-base font-semibold text-stone-900">관리자 로그 디버그 패널</h2>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-stone-700 md:grid-cols-2">
        <div className="rounded-2xl bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">런타임 모드</div>
          <div className="mt-1 font-medium text-stone-900">{APP_RUNTIME_MODE}</div>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">활성 플래그</div>
          <div className="mt-1 font-medium text-stone-900">
            {Object.entries(DEV_DEBUG_FLAGS)
              .filter(([, enabled]) => enabled)
              .map(([key]) => key)
              .join(", ") || "없음"}
          </div>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">카테고리 건수</div>
          <div className="mt-1 text-stone-900">
            작업 {counts.work ?? 0} · 검수 {counts.inventory ?? 0} · 첨부 {counts.attachment ?? 0}
          </div>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">중복 로그 ID</div>
          <div className="mt-1 text-stone-900">{duplicateIds.length > 0 ? `${duplicateIds.length}건 감지` : "없음"}</div>
        </div>
      </div>
      <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-xs leading-6 text-stone-700">
        <div className="font-semibold text-stone-900">최근 로그 샘플</div>
        <div className="mt-2 space-y-1.5">
          {historyEvents.slice(0, 5).map((item, index) => (
            <div key={`${item.id}-${index}`} className="rounded-xl bg-stone-50 px-2.5 py-2">
              <div className="font-medium text-stone-900">{item.action} · {item.workOrderId}</div>
              <div className="text-stone-600">{item.summary}</div>
            </div>
          ))}
          {historyEvents.length === 0 ? <div className="text-stone-500">표시할 로그가 없습니다.</div> : null}
        </div>
      </div>
    </div>
  );
}
