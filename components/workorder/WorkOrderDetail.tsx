import type { ChangeEvent, ReactNode, RefObject } from "react";
import { getStageTone } from "@/lib/constants/workflow";
import type { DisplayStage } from "@/types/workflow";
import { toDisplayValue } from "@/lib/utils/display";
import type { Attachment, Material, Outsourcing, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

type RowValue = string | number | null | undefined;

function Info({ label, value, valueClassName }: { label: string; value: RowValue; valueClassName?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-3">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 font-medium ${valueClassName ?? "text-sm"}`}>{toDisplayValue(value)}</div>
    </div>
  );
}

function MobileDataCard({ title, rows }: { title: string; rows: [string, RowValue][] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="text-sm font-semibold text-stone-900">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={`${title}-${label}`} className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-xs text-stone-500">{label}</span>
            <span className="text-right text-sm font-medium text-stone-900">{toDisplayValue(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  summary,
  open,
  onToggle,
  rightSlot,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-stone-300 hover:bg-stone-50"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-900 md:text-base">{title}</div>
          <div className="mt-1 truncate text-xs text-stone-500 md:text-sm">{summary}</div>
        </div>
        <span className="shrink-0 rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600">{open ? "접기" : "펼치기"}</span>
      </button>
      {rightSlot ? <div className="hidden shrink-0 md:block">{rightSlot}</div> : null}
    </div>
  );
}

function DataSection({
  title,
  buttonLabel,
  open,
  onToggle,
  summaryText,
  mobileItems,
  desktopHeaders,
  desktopRows,
}: {
  title: string;
  buttonLabel: string;
  open: boolean;
  onToggle: () => void;
  summaryText: string;
  mobileItems: { key: string; title: string; rows: [string, RowValue][] }[];
  desktopHeaders: string[];
  desktopRows: RowValue[][];
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader
        title={title}
        summary={summaryText}
        open={open}
        onToggle={onToggle}
        rightSlot={<button type="button" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">{buttonLabel}</button>}
      />
      {open ? (
        <>
          <div className="mt-3 md:hidden">
            <button type="button" className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">{buttonLabel}</button>
          </div>
          <div className="mt-4 space-y-3 md:hidden">
            {mobileItems.map((item) => <MobileDataCard key={item.key} title={item.title} rows={item.rows} />)}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {desktopHeaders.map((header) => <th key={header} className="px-2 py-3">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {desktopRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-stone-100">
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`} className={`px-2 py-3 ${cellIndex === row.length - 2 ? "font-medium" : ""}`}>{toDisplayValue(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StageProgressBar({ stages, currentStage }: { stages: DisplayStage[]; currentStage: DisplayStage }) {
  const currentIndex = stages.indexOf(currentStage);
  const previousStage = currentIndex > 0 ? stages[currentIndex - 1] : null;
  const nextStage = currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:mt-5 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-stone-900 md:text-sm">진행 단계</div>
          <div className="mt-1 text-[11px] text-stone-500 md:text-xs">현재 상태를 중심으로 확인합니다.</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium md:px-3 md:text-xs ${getStageTone(currentStage)}`}>{currentStage}</span>
      </div>

      <div className="mt-3 md:hidden">
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
            <span className="min-w-0 flex-1 truncate text-left">{previousStage ?? "시작"}</span>
            <span className="shrink-0">→</span>
            <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[11px] font-semibold text-white">{currentStage}</span>
            <span className="shrink-0">→</span>
            <span className="min-w-0 flex-1 truncate text-right">{nextStage ?? "완료"}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 hidden overflow-x-auto pb-1 md:block">
        <div className="flex min-w-max items-center gap-2">
          {stages.map((stage, index) => {
            const isCurrent = stage === currentStage;
            const isDone = currentIndex >= 0 && index < currentIndex;
            const isUpcoming = !isCurrent && !isDone;

            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="flex min-w-[82px] flex-col items-center text-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isCurrent
                        ? "bg-stone-900 text-white"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>
                  <div
                    className={`mt-1.5 text-[11px] leading-4 ${
                      isCurrent
                        ? "font-semibold text-stone-900"
                        : isUpcoming
                        ? "text-stone-500"
                        : "text-stone-700"
                    }`}
                  >
                    {stage}
                  </div>
                </div>
                {index < stages.length - 1 ? <div className="h-px w-6 shrink-0 bg-stone-300" /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BasicInfoSection({
  workOrder,
  currentInventoryQuantity,
  canEditInventory,
  currentUserName,
  currentRole,
  open,
  onToggle,
  onOpenInventoryEditor,
}: {
  workOrder: WorkOrder;
  currentInventoryQuantity: number;
  canEditInventory: boolean;
  currentUserName: string;
  currentRole: string;
  open: boolean;
  onToggle: () => void;
  onOpenInventoryEditor: () => void;
}) {
  const infoItems: [string, RowValue, string?][] = [
    ["대분류", workOrder.category1],
    ["중분류", workOrder.category2],
    ["소분류", workOrder.category3],
    ["시즌", workOrder.season],
    ["우선순위", workOrder.priority],
    ["공장", workOrder.vendor],
    ["담당자", workOrder.manager],
    ["납기일", workOrder.dueDate],
    ["발주 수량", `${workOrder.quantity}장`, "text-base font-semibold tabular-nums"],
    ["재고 수량", `${currentInventoryQuantity}장`, "text-base font-semibold tabular-nums"],
  ];

  const summary = [workOrder.category1, workOrder.category2, workOrder.vendor, `${workOrder.quantity}장`, workOrder.dueDate]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader title="기본 정보" summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {infoItems.map(([label, value, valueClassName]) => (
              <Info key={label} label={label} value={value} valueClassName={valueClassName} />
            ))}
          </div>
          {canEditInventory && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3">
              <div>
                <div className="text-sm font-semibold text-stone-900">재고 수정</div>
                <div className="mt-1 text-xs text-stone-500">수정자: {currentUserName} · {currentRole}</div>
              </div>
              <button type="button" onClick={onOpenInventoryEditor} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white">재고 수정</button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MaterialSection({ materials, open, onToggle }: { materials: Material[]; open: boolean; onToggle: () => void }) {
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = materials.length > 0
    ? `${materials[0].name}${materials.length > 1 ? ` 외 ${materials.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 원단/부자재가 없습니다.";

  return (
    <DataSection
      title="원단 / 부자재 구성"
      buttonLabel="항목 추가"
      open={open}
      onToggle={onToggle}
      summaryText={summary}
      mobileItems={materials.map((item) => ({
        key: `${item.name}-${item.vendor}`,
        title: `${item.type} · ${item.name}`,
        rows: [["거래처", item.vendor], ["수량", `${item.quantity}${item.unit}`], ["단가", `${(item.unitCost ?? 0).toLocaleString()}원`], ["금액", `${(item.totalCost ?? 0).toLocaleString()}원`], ["상태", item.status]],
      }))}
      desktopHeaders={["구분", "자재명", "거래처", "수량", "단가", "금액", "상태"]}
      desktopRows={materials.map((item) => [item.type, item.name, item.vendor, `${item.quantity}${item.unit}`, `${(item.unitCost ?? 0).toLocaleString()}원`, `${(item.totalCost ?? 0).toLocaleString()}원`, item.status])}
    />
  );
}

function OutsourcingSection({ outsourcing, open, onToggle }: { outsourcing: Outsourcing[]; open: boolean; onToggle: () => void }) {
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = outsourcing.length > 0
    ? `${outsourcing[0].process}${outsourcing.length > 1 ? ` 외 ${outsourcing.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 외주 공정이 없습니다.";

  return (
    <DataSection
      title="외주 공정"
      buttonLabel="공정 추가"
      open={open}
      onToggle={onToggle}
      summaryText={summary}
      mobileItems={outsourcing.map((item) => ({
        key: `${item.process}-${item.vendor}`,
        title: item.process,
        rows: [["외주처", item.vendor], ["수량", String(item.quantity)], ["단가기준", item.unitType], ["단가", `${(item.unitCost ?? 0).toLocaleString()}원`], ["금액", `${(item.totalCost ?? 0).toLocaleString()}원`], ["상태", item.status]],
      }))}
      desktopHeaders={["공정", "외주처", "수량", "단가기준", "단가", "금액", "상태"]}
      desktopRows={outsourcing.map((item) => [item.process, item.vendor, String(item.quantity), item.unitType, `${(item.unitCost ?? 0).toLocaleString()}원`, `${(item.totalCost ?? 0).toLocaleString()}원`, item.status])}
    />
  );
}

export default function WorkOrderDetail({
  workOrder,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentInventoryQuantity,
  currentUserName,
  currentRole,
  canEditInventory,
  canSeeProductionSections,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onSave,
  onOpenInventoryEditor,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  visibleStages,
  currentDisplayStage,
  actions,
  onAction,
}: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
  currentInventoryQuantity: number;
  currentUserName: string;
  currentRole: string;
  canEditInventory: boolean;
  canSeeProductionSections: boolean;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  onToggleBasicInfo: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  visibleStages: DisplayStage[];
  currentDisplayStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="mt-1 break-keep text-2xl font-semibold">{workOrder.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentWorkflowState)}`}>상태: {currentWorkflowState}</div>
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${saveStatus === "saving" ? "bg-cyan-100 text-cyan-800" : saveStatus === "dirty" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {saveStatus === "saving" ? "저장 중" : saveStatus === "dirty" ? "저장되지 않음" : "저장됨"}
            </div>
            {lastSavedAt && <div className="text-xs text-stone-500">마지막 저장: {lastSavedAt}</div>}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {actions.length > 0 ? (
            actions.map((action) => (
              <button
                key={`${currentWorkflowState}-${action.nextState}-${action.label}`}
                type="button"
                onClick={() => onAction(action)}
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-100 sm:flex-none"
              >
                {action.label}
              </button>
            ))
          ) : null}
          <button type="button" className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm sm:flex-none">복제</button>
          <button type="button" onClick={onSave} className="flex-1 rounded-xl bg-stone-900 px-4 py-2 text-sm text-white sm:flex-none">즉시 저장</button>
        </div>
      </div>

      <StageProgressBar stages={visibleStages} currentStage={currentDisplayStage} />

      <div className="mt-6 grid gap-6">
        <BasicInfoSection
          workOrder={workOrder}
          currentInventoryQuantity={currentInventoryQuantity}
          canEditInventory={canEditInventory}
          currentUserName={currentUserName}
          currentRole={currentRole}
          open={basicInfoOpen}
          onToggle={onToggleBasicInfo}
          onOpenInventoryEditor={onOpenInventoryEditor}
        />

        {canSeeProductionSections ? <MaterialSection materials={workOrder.materials ?? []} open={materialOpen} onToggle={onToggleMaterial} /> : null}
        {canSeeProductionSections ? <OutsourcingSection outsourcing={workOrder.outsourcing ?? []} open={outsourcingOpen} onToggle={onToggleOutsourcing} /> : null}

        <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
          <h3 className="text-base font-semibold">작업 메모</h3>
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{workOrder.memo}</div>
        </div>
      </div>
    </div>
  );
}
