"use client";

import { useState } from "react";
import { getDisplayStageDescription, getStageTone } from "@/lib/constants/workflow";
import { getPermissionSummary } from "@/lib/constants/roles";
import { toDisplayValue } from "@/lib/utils/display";
import type { DisplayStage, HistoryFilter, HistoryLog, HistoryTone, Outsourcing, UserProfile, WorkflowAction, WorkflowState } from "@/types/workorder";

function SummaryRow({ label, value, strong = false }: { label: string; value: string | number | null | undefined; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={strong ? "font-semibold text-stone-900" : "font-medium"}>{toDisplayValue(value)}</span>
    </div>
  );
}

function getHistoryToneClass(tone: HistoryTone) {
  switch (tone) {
    case "blue": return "bg-blue-100 text-blue-700";
    case "violet": return "bg-violet-100 text-violet-700";
    case "emerald": return "bg-emerald-100 text-emerald-700";
    case "rose": return "bg-rose-100 text-rose-700";
    case "amber": return "bg-amber-100 text-amber-700";
    default: return "bg-stone-100 text-stone-700";
  }
}

function HistoryPreviewItem({ item }: { item: HistoryLog }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getHistoryToneClass(item.tone)}`}>{item.action}</div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{item.time}</span>
            {hasDetails && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">{open ? "접기" : "상세"}</span>}
          </div>
        </div>
        <div className="mt-2 text-xs text-stone-500">{item.user}</div>
        <div className="mt-1 text-sm text-stone-700">{item.message}</div>
      </button>

      {hasDetails && open && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {item.transition && (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {item.transition.from} <span className="px-1 text-stone-400">→</span> {item.transition.to}
            </div>
          )}
          {item.detailLines?.map((detail, index) => (
            <div key={`${item.id}-detail-${index}`} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
              <span>
                {detail.label ? <span className="font-medium text-stone-900">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkOrderSidePanel({
  currentUser,
  users,
  onCurrentUserChange,
  onOpenPermissions,
  currentState,
  currentDisplayStage,
  visibleStages,
  actions,
  onAction,
  canSeeCostSections,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  outsourcing,
  canSeeInventoryHistorySection,
  isAdmin,
  currentRole,
  filteredHistoryLogs,
  historyFilter,
  onHistoryFilterChange,
  onOpenInventoryLogModal,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  onCurrentUserChange: (userId: string) => void;
  onOpenPermissions: () => void;
  currentState: WorkflowState;
  currentDisplayStage: DisplayStage;
  visibleStages: DisplayStage[];
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  canSeeCostSections: boolean;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
  outsourcing: Outsourcing[];
  canSeeInventoryHistorySection: boolean;
  isAdmin: boolean;
  currentRole: string;
  filteredHistoryLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
  onOpenInventoryLogModal: () => void;
}) {
  const currentIndex = visibleStages.indexOf(currentDisplayStage);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">진행 단계</h3>
            <p className="mt-1 text-xs text-stone-500">상태와 가능한 행동을 함께 표시</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentState)}`}>{currentState}</span>
        </div>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-stone-500">현재 사용자</div>
            <button type="button" onClick={onOpenPermissions} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] text-stone-700">권한 설정</button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
            {users.map((user) => {
              const active = user.id === currentUser.id;
              return (
                <button key={user.id} type="button" onClick={() => onCurrentUserChange(user.id)} className={`rounded-xl px-3 py-3 text-left ${active ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}>
                  <div className="text-xs font-semibold">{user.name}</div>
                  <div className={`mt-1 text-[11px] ${active ? "text-stone-300" : "text-stone-500"}`}>{getPermissionSummary(user)}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="text-xs font-medium text-stone-500">현재 상태 설명</div>
          <div className="mt-2 text-sm leading-6 text-stone-800">{getDisplayStageDescription(currentDisplayStage)}</div>
        </div>
        <div className="mt-4 space-y-3">
          {visibleStages.map((stage, index) => {
            const isCurrent = stage === currentDisplayStage;
            const isDone = currentIndex >= 0 && index < currentIndex;
            const isUpcoming = !isCurrent && !isDone;
            return (
              <div key={stage} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isCurrent ? "bg-stone-900 text-white" : isDone ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-500"}`}>{isDone ? "✓" : index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${isCurrent ? "font-semibold text-stone-900" : isUpcoming ? "text-stone-500" : "text-stone-700"}`}>{stage}</div>
                  {isCurrent && <div className="mt-1 text-xs text-stone-500">현재 단계</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">가능한 액션</div>
            <span className="text-xs text-stone-500">권한 기준</span>
          </div>
          {actions.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              {actions.map((action) => (
                <button key={`${currentState}-${action.nextState}-${action.label}`} type="button" onClick={() => onAction(action)} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50">{action.label}</button>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">현재 사용자 권한에서는 실행 가능한 액션이 없습니다.</div>
          )}
        </div>
      </div>

      {canSeeCostSections && (
        <>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">비용 요약</h3>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="원단 합계" value={`${fabricTotal.toLocaleString()}원`} />
              <SummaryRow label="부자재 합계" value={`${subsidiaryTotal.toLocaleString()}원`} />
              <SummaryRow label="외주 합계" value={`${outsourcingTotal.toLocaleString()}원`} />
              <div className="border-t border-stone-200 pt-3">
                <SummaryRow label="총합" value={`${totalCost.toLocaleString()}원`} strong />
                <SummaryRow label="장당 추정 원가" value={`${unitCost.toLocaleString()}원`} />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">공정별 금액</h3>
            <div className="mt-4 space-y-2 text-sm">
              {outsourcing.map((item) => <SummaryRow key={item.process} label={item.process} value={`${(item.totalCost ?? 0).toLocaleString()}원`} />)}
            </div>
          </div>
        </>
      )}

      {canSeeInventoryHistorySection && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">최근 히스토리</h3>
              <div className="mt-1 text-xs text-stone-500">
                {isAdmin ? "요약 문구를 누르면 상세 변경 내용을 펼쳐서 확인할 수 있습니다." : currentRole === "디자이너" ? "작업 관련 히스토리만 표시됩니다." : "재고 관련 히스토리만 표시됩니다."}
              </div>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{filteredHistoryLogs.length}건</span>
          </div>
          {isAdmin && (
            <div className="mt-3 flex flex-wrap gap-2">
              {([ ["all", "전체"], ["work", "작업"], ["inventory", "재고"] ] as [HistoryFilter, string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => onHistoryFilterChange(value)} className={`rounded-full px-3 py-1 text-xs font-medium ${historyFilter === value ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}>{label}</button>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-3">
            {filteredHistoryLogs.length > 0 ? filteredHistoryLogs.slice(0, 3).map((item) => (
              <HistoryPreviewItem key={item.id} item={item} />
            )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">표시할 히스토리가 없습니다.</div>}
          </div>
          {filteredHistoryLogs.length > 3 && <button type="button" onClick={onOpenInventoryLogModal} className="mt-4 w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800">전체 히스토리 보기</button>}
        </div>
      )}
    </div>
  );
}
