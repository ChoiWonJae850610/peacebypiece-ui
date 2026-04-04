import type { ChangeEvent, RefObject } from "react";
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

function DataSection({
  title,
  buttonLabel,
  mobileOpen,
  onToggle,
  summaryText,
  mobileItems,
  desktopHeaders,
  desktopRows,
}: {
  title: string;
  buttonLabel: string;
  mobileOpen: boolean;
  onToggle: () => void;
  summaryText: string;
  mobileItems: { key: string; title: string; rows: [string, RowValue][] }[];
  desktopHeaders: string[];
  desktopRows: RowValue[][];
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button type="button" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">{buttonLabel}</button>
      </div>
      <div className="mt-4 md:hidden">
        <button type="button" onClick={onToggle} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{title}</div>
              <div className="mt-1 text-xs text-stone-500">{summaryText}</div>
            </div>
            <span className="shrink-0 text-lg text-stone-500">{mobileOpen ? "−" : "+"}</span>
          </div>
        </button>
        {mobileOpen && (
          <div className="mt-3 space-y-3">
            {mobileItems.map((item) => <MobileDataCard key={item.key} title={item.title} rows={item.rows} />)}
          </div>
        )}
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

function MaterialSection({ materials, open, onToggle }: { materials: Material[]; open: boolean; onToggle: () => void }) {
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  return (
    <DataSection
      title="원단 / 부자재 구성"
      buttonLabel="항목 추가"
      mobileOpen={open}
      onToggle={onToggle}
      summaryText={`총 ${materials.length}개 / ${total.toLocaleString()}원`}
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
  return (
    <DataSection
      title="외주 공정"
      buttonLabel="공정 추가"
      mobileOpen={open}
      onToggle={onToggle}
      summaryText={`총 ${outsourcing.length}개 / ${total.toLocaleString()}원`}
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

function AttachmentSection({
  canSeeAttachments,
  attachments,
  attachmentInputRef,
  onOpenAttachmentPicker,
  onAttachmentFiles,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
}: {
  canSeeAttachments: boolean;
  attachments: Attachment[];
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  onOpenAttachmentPicker: () => void;
  onAttachmentFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
}) {
  if (!canSeeAttachments) return null;
  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">첨부파일</h3>
          <div className="mt-1 text-xs text-stone-500">이미지와 PDF를 작업지시서에 함께 보관합니다.</div>
        </div>
        <button type="button" onClick={onOpenAttachmentPicker} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800">+ 추가</button>
      </div>
      <input ref={attachmentInputRef} type="file" accept="image/*,.pdf,application/pdf" multiple className="hidden" onChange={onAttachmentFiles} />
      {attachments.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <button type="button" onClick={() => onPreviewAttachment(attachment.id)} className="block w-full text-left">
                <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                  {attachment.type === "image" ? <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-rose-50 text-sm font-semibold text-rose-700">PDF 미리보기</div>}
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-medium text-stone-900">{attachment.name}</div>
                  <div className="mt-1 text-xs text-stone-500">{attachment.type === "image" ? "이미지" : "PDF"}</div>
                  <div className="mt-1 text-[11px] text-stone-400">업로드: {attachment.ownerName ?? "기존 첨부"}</div>
                </div>
              </button>
              {canDeleteAttachment(attachment) && (
                <div className="border-t border-stone-200 p-3">
                  <button type="button" onClick={() => onDeleteAttachment(attachment.id)} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">삭제</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">아직 첨부파일이 없습니다.</div>
      )}
    </div>
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
  canSeeAttachments,
  materialOpen,
  outsourcingOpen,
  attachmentInputRef,
  onSave,
  onOpenInventoryEditor,
  onToggleMaterial,
  onToggleOutsourcing,
  onOpenAttachmentPicker,
  onAttachmentFiles,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
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
  canSeeAttachments: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  onOpenAttachmentPicker: () => void;
  onAttachmentFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
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
        <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
          <h3 className="text-base font-semibold">기본 분류</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Info label="대분류" value={workOrder.category1} />
            <Info label="중분류" value={workOrder.category2} />
            <Info label="소분류" value={workOrder.category3} />
            <Info label="시즌" value={workOrder.season} />
            <Info label="우선순위" value={workOrder.priority} />
            <Info label="공장" value={workOrder.vendor} />
            <Info label="담당자" value={workOrder.manager} />
            <Info label="납기일" value={workOrder.dueDate} />
            <Info label="발주 수량" value={`${workOrder.quantity}장`} valueClassName="text-base font-semibold tabular-nums" />
            <Info label="재고 수량" value={`${currentInventoryQuantity}장`} valueClassName="text-base font-semibold tabular-nums" />
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

        {canSeeProductionSections && <MaterialSection materials={workOrder.materials ?? []} open={materialOpen} onToggle={onToggleMaterial} />}
        {canSeeProductionSections && <OutsourcingSection outsourcing={workOrder.outsourcing ?? []} open={outsourcingOpen} onToggle={onToggleOutsourcing} />}

        <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
          <h3 className="text-base font-semibold">작업 메모</h3>
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{workOrder.memo}</div>
        </div>
      </div>
    </div>
  );
}
