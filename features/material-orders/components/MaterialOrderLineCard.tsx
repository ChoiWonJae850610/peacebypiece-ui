"use client";

import type { ReactNode } from "react";

import ModalShell from "@/components/common/modal/ModalShell";
import {
  AppNumberInput,
  AppSelect,
  WaflButton,
  WaflInput,
  WaflModalSection,
  WaflSurface,
  WAFL_FIELD_INPUT_CLASS,
  type AppSelectOption,
} from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import { MaterialOrderQuantityText } from "@/features/material-orders/components/MaterialOrderQuantityDisplay";
import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
} from "@/lib/material-orders/materialOrderDraftCalculator";

export const MATERIAL_ORDER_UNIT_OPTIONS = [
  "마",
  "야드",
  "개",
  "세트",
  "롤",
  "봉",
  "박스",
] as const;

export const MATERIAL_ORDER_UNIT_SELECT_OPTIONS: AppSelectOption[] = [
  { value: "", label: "단위" },
  ...MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit })),
];

export type MaterialOrderLineEditDraft = {
  itemName: string;
  unit: string;
  orderQuantity: number;
  unitPrice: number;
};

type MaterialOrderLineCardProps = {
  line: MaterialOrderDraftLine;
  editable: boolean;
  onEdit: () => void;
  onRemove: () => void;
  menuPanelClassName?: string;
};

export function MaterialOrderLineCard({
  line,
  editable,
  onEdit,
  onRemove,
  menuPanelClassName,
}: MaterialOrderLineCardProps) {
  const lineAmount = calculateMaterialOrderLineAmount(line);
  const requiredQuantity = calculateMaterialOrderLineAllocatedQuantity(line);
  const extraQuantity = Math.max(
    0,
    Number((line.orderQuantity - requiredQuantity).toFixed(2)),
  );
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
            <span className="truncate">필요수량 <MaterialOrderQuantityText quantity={requiredQuantity} unit={unitLabel} /></span>
            <span className="truncate">주문수량 <MaterialOrderQuantityText quantity={line.orderQuantity} unit={unitLabel} /></span>
            <span className="truncate">여유주문 <MaterialOrderQuantityText quantity={extraQuantity} unit={unitLabel} /></span>
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

export function MaterialOrderLineEditModal({
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
  const canApply = draft.itemName.trim().length > 0 && draft.orderQuantity >= 1;
  const handleApply = () => {
    if (!canApply) return;
    onApply();
  };

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
        <WaflButton
          type="button"
          variant="primary"
          size="sm"
          disabled={!canApply}
          onClick={handleApply}
        >
          적용
        </WaflButton>
      }
    >
      <WaflModalSection className="grid gap-3">
        <FieldLabel label="품목명">
          <WaflInput
            fieldSize="sm"
            value={draft.itemName}
            onChange={(event) =>
              onChangeDraft({ ...draft, itemName: event.target.value })
            }
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
            <AppNumberInput
              inputMode="decimal"
              min={0}
              value={draft.orderQuantity}
              onValueChange={(value) =>
                onChangeDraft({ ...draft, orderQuantity: value })
              }
              component="material-order-line-edit-quantity-input"
              className={WAFL_FIELD_INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="단가">
            <AppNumberInput
              inputMode="numeric"
              min={0}
              value={draft.unitPrice}
              onValueChange={(value) =>
                onChangeDraft({ ...draft, unitPrice: value })
              }
              component="material-order-line-edit-unit-price-input"
              className={WAFL_FIELD_INPUT_CLASS}
            />
          </FieldLabel>
        </div>
        <WaflSurface
          component="material-order-line-edit-amount"
          shape="control"
          tone="muted"
          className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold"
        >
          <span className="pbp-text-subtle">금액</span>
          <span className="tabular-nums pbp-text-primary">
            {formatMaterialOrderAmount(lineAmount)}
          </span>
        </WaflSurface>
      </WaflModalSection>
    </ModalShell>
  );
}

export function resolveUnitSelectValue(unit: string): string {
  return MATERIAL_ORDER_UNIT_OPTIONS.includes(
    unit as (typeof MATERIAL_ORDER_UNIT_OPTIONS)[number],
  )
    ? unit
    : "";
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
      <span>{label}</span>
      {children}
    </label>
  );
}
