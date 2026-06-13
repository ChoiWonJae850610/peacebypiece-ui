"use client";

import { useState, type ReactNode } from "react";

import ModalShell from "@/components/common/modal/ModalShell";
import { AppSelect, WaflButton, WaflEmptyCard, WaflInput, WaflModalSection, WaflSurface, type AppSelectOption } from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
} from "@/lib/material-orders/materialOrderDraftCalculator";

const MATERIAL_ORDER_UNIT_OPTIONS = [
  "마",
  "야드",
  "개",
  "세트",
  "롤",
  "봉",
  "박스",
] as const;

const MATERIAL_ORDER_UNIT_SELECT_OPTIONS: AppSelectOption[] = [
  { value: "", label: "단위" },
  ...MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit })),
];

type MaterialOrderLineTableProps = {
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
};

type MaterialOrderLineEditDraft = {
  itemName: string;
  unit: string;
  orderQuantity: number;
  unitPrice: number;
};

export function MaterialOrderLineTable(props: MaterialOrderLineTableProps) {
  return <MaterialOrderLineCards {...props} />;
}

export function MaterialOrderLineMobileCards(props: MaterialOrderLineTableProps) {
  return <MaterialOrderLineCards {...props} mobile />;
}

function MaterialOrderLineCards({
  lines,
  editable,
  onChangeLine,
  onRemoveLine,
  mobile = false,
}: MaterialOrderLineTableProps & { mobile?: boolean }) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<MaterialOrderLineEditDraft | null>(null);
  const editingLine = editingLineId ? lines.find((line) => line.id === editingLineId) ?? null : null;

  const openEditModal = (line: MaterialOrderDraftLine) => {
    setEditingLineId(line.id);
    setEditDraft({
      itemName: line.itemName,
      unit: resolveUnitSelectValue(line.unit),
      orderQuantity: line.orderQuantity,
      unitPrice: line.unitPrice,
    });
  };

  const closeEditModal = () => {
    setEditingLineId(null);
    setEditDraft(null);
  };

  const applyEdit = () => {
    if (!editingLine || !editDraft) return;
    onChangeLine(editingLine.id, {
      itemName: editDraft.itemName,
      unit: editDraft.unit,
      orderQuantity: editDraft.orderQuantity,
      unitPrice: editDraft.unitPrice,
    });
    closeEditModal();
  };

  if (lines.length === 0) {
    return (
      <WaflEmptyCard
        component={mobile ? "material-order-line-mobile-empty" : "material-order-line-empty"}
        shape="control"
        className={`${mobile ? "min-h-[120px]" : "min-h-[96px]"} px-4 py-5`}
      >
        <p className="font-semibold pbp-text-primary">발주 품목을 추가하세요.</p>
        <p className="mt-1 text-xs pbp-text-muted">작업지시서 자재 선택 패널에서 이번 발주서에 담을 품목을 추가합니다.</p>
      </WaflEmptyCard>
    );
  }

  return (
    <>
      <div className="grid min-w-0 gap-2">
        {lines.map((line) => (
          <MaterialOrderLineCard
            key={line.id}
            line={line}
            editable={editable}
            onEdit={() => openEditModal(line)}
            onRemove={() => onRemoveLine(line.id)}
            menuPanelClassName="bottom-9 top-auto"
          />
        ))}
      </div>
      {editingLine && editDraft ? (
        <MaterialOrderLineEditModal
          draft={editDraft}
          lineAmount={calculateMaterialOrderLineAmount({ ...editingLine, ...editDraft })}
          onChangeDraft={setEditDraft}
          onClose={closeEditModal}
          onApply={applyEdit}
        />
      ) : null}
    </>
  );
}

function MaterialOrderLineCard({
  line,
  editable,
  onEdit,
  onRemove,
  menuPanelClassName,
}: {
  line: MaterialOrderDraftLine;
  editable: boolean;
  onEdit: () => void;
  onRemove: () => void;
  menuPanelClassName?: string;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);
  const requiredQuantity = calculateMaterialOrderLineAllocatedQuantity(line);
  const extraQuantity = Math.max(0, Number((line.orderQuantity - requiredQuantity).toFixed(2)));
  const unitLabel = line.unit || "미선택";

  return (
    <WaflSurface
      as="article"
      component="material-order-line-card"
      shape="control"
      tone="muted"
      className="p-3"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold pbp-text-primary">
            {line.itemName || "품목명 미입력"}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-medium leading-4 pbp-text-muted sm:grid-cols-4">
            <span className="truncate">필요수량 {requiredQuantity.toLocaleString()} {unitLabel}</span>
            <span className="truncate">주문수량 {line.orderQuantity.toLocaleString()} {unitLabel}</span>
            <span className="truncate">여유주문 {extraQuantity.toLocaleString()} {unitLabel}</span>
            <span className="truncate">단가 {formatMaterialOrderAmount(line.unitPrice)}</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold tabular-nums pbp-text-primary">
            금액 {formatMaterialOrderAmount(lineAmount)}
          </p>
        </div>
        {editable ? (
          <WorkOrderCardActionMenu
            menuLabel="발주 품목 작업"
            editLabel="발주 품목 수정"
            editText="수정"
            onEdit={onEdit}
            deleteLabel="발주 품목 삭제"
            deleteText="삭제"
            onDelete={onRemove}
            menuPanelClassName={menuPanelClassName}
          />
        ) : null}
      </div>
    </WaflSurface>
  );
}

function MaterialOrderLineEditModal({
  draft,
  lineAmount,
  onChangeDraft,
  onClose,
  onApply,
}: {
  draft: MaterialOrderLineEditDraft;
  lineAmount: number;
  onChangeDraft: (draft: MaterialOrderLineEditDraft) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <ModalShell
      open
      title="발주 품목 수정"
      description="품목명, 단위, 수량과 단가를 입력한 뒤 적용합니다."
      onClose={onClose}
      maxWidthClass="md:max-w-xl"
      bodyClassName="grid gap-3"
      footerClassName="flex justify-end"
      footer={
        <WaflButton type="button" variant="primary" size="sm" onClick={onApply}>적용</WaflButton>
      }
    >
      <WaflModalSection className="grid gap-3">
        <FieldLabel label="품목명">
          <WaflInput
            fieldSize="sm"
            value={draft.itemName}
            onChange={(event) => onChangeDraft({ ...draft, itemName: event.target.value })}
            placeholder="예: 30수 면"
          />
        </FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="단위">
            <AppSelect
              value={draft.unit}
              onValueChange={(value) => onChangeDraft({ ...draft, unit: value })}
              options={MATERIAL_ORDER_UNIT_SELECT_OPTIONS}
              placeholder="단위"
              size="sm"
              ariaLabel="발주 단위"
            />
          </FieldLabel>
          <FieldLabel label="수량">
            <WaflInput
              fieldSize="sm"
              type="text"
              inputMode="decimal"
              value={draft.orderQuantity}
              onChange={(event) => onChangeDraft({ ...draft, orderQuantity: normalizeNumberInput(event.target.value) })}
              className="text-right tabular-nums"
            />
          </FieldLabel>
          <FieldLabel label="단가">
            <WaflInput
              fieldSize="sm"
              type="text"
              inputMode="numeric"
              value={draft.unitPrice}
              onChange={(event) => onChangeDraft({ ...draft, unitPrice: normalizeNumberInput(event.target.value) })}
              className="text-right tabular-nums"
            />
          </FieldLabel>
        </div>
        <WaflSurface component="material-order-line-edit-amount" shape="control" tone="muted" className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold">
          <span className="pbp-text-subtle">금액</span>
          <span className="tabular-nums pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</span>
        </WaflSurface>
      </WaflModalSection>
    </ModalShell>
  );
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
      <span>{label}</span>
      {children}
    </label>
  );
}

function normalizeNumberInput(value: string | number): number {
  const normalizedValue = String(value).replace(/,/g, "").trim();
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveUnitSelectValue(unit: string): string {
  return MATERIAL_ORDER_UNIT_OPTIONS.includes(
    unit as (typeof MATERIAL_ORDER_UNIT_OPTIONS)[number],
  )
    ? unit
    : "";
}
