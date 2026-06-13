"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { WaflButton, WaflInput, WaflModalSection, WaflSurface } from "@/components/common/ui";
import { formatMaterialOrderAmount } from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderLineAddModalProps = {
  open: boolean;
  itemName: string;
  unit: string;
  requiredQuantity: number;
  orderQuantity: number;
  unitPrice: number;
  onChange: (patch: Partial<{ orderQuantity: number; unitPrice: number }>) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function MaterialOrderLineAddModal({
  open,
  itemName,
  unit,
  requiredQuantity,
  orderQuantity,
  unitPrice,
  onChange,
  onClose,
  onConfirm,
}: MaterialOrderLineAddModalProps) {
  const extraQuantity = Math.max(0, Number((orderQuantity - requiredQuantity).toFixed(2)));
  const amount = Number((orderQuantity * unitPrice).toFixed(2));

  return (
    <ModalShell
      open={open}
      title="발주 품목 추가"
      description="필요수량을 확인하고 주문수량과 단가를 입력합니다."
      onClose={onClose}
      maxWidthClass="md:max-w-lg"
      bodyClassName="grid gap-3"
      footerClassName="flex justify-end"
      footer={
        <WaflButton type="button" variant="primary" size="sm" disabled={orderQuantity <= 0} onClick={onConfirm}>
          추가
        </WaflButton>
      }
    >
      <WaflModalSection className="grid gap-3">
        <div>
          <p className="text-[11px] font-semibold pbp-text-subtle">품목</p>
          <p className="mt-1 text-sm font-semibold pbp-text-primary">{itemName || "품목명 미입력"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <span>필요수량</span>
            <WaflInput fieldSize="sm" value={`${requiredQuantity.toLocaleString()} ${unit}`} disabled />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <span>주문수량</span>
            <WaflInput
              fieldSize="sm"
              type="text"
              inputMode="decimal"
              value={orderQuantity}
              onChange={(event) => onChange({ orderQuantity: normalizeNumberInput(event.target.value) })}
              className="text-right tabular-nums"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <span>단가</span>
            <WaflInput
              fieldSize="sm"
              type="text"
              inputMode="numeric"
              value={unitPrice}
              onChange={(event) => onChange({ unitPrice: normalizeNumberInput(event.target.value) })}
              className="text-right tabular-nums"
            />
          </label>
          <WaflSurface component="material-order-line-add-extra" shape="control" tone="muted" className="grid content-center gap-1 px-3 py-2">
            <span className="text-[11px] font-semibold pbp-text-subtle">여유주문</span>
            <span className="text-sm font-semibold tabular-nums pbp-text-primary">{extraQuantity.toLocaleString()} {unit}</span>
          </WaflSurface>
        </div>
        <WaflSurface component="material-order-line-add-amount" shape="control" tone="muted" className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold">
          <span className="pbp-text-subtle">금액</span>
          <span className="tabular-nums pbp-text-primary">{formatMaterialOrderAmount(amount)}</span>
        </WaflSurface>
      </WaflModalSection>
    </ModalShell>
  );
}

function normalizeNumberInput(value: string | number): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}
