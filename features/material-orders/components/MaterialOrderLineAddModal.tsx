"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { useRef, type MouseEvent, type PointerEvent, type TouchEvent } from "react";
import { AppNumberInput, WaflButton, WaflInput, WaflModalSection, WaflSurface, WAFL_FIELD_INPUT_CLASS } from "@/components/common/ui";
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
  onConfirm: (values?: { orderQuantity: number; unitPrice: number }) => void;
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
  const confirmLockRef = useRef(false);
  const lastConfirmAtRef = useRef(0);
  const normalizedOrderQuantity = Number.isFinite(orderQuantity) ? orderQuantity : 0;
  const normalizedUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
  const canConfirm = normalizedOrderQuantity >= 1;
  const extraQuantity = Math.max(0, Number((normalizedOrderQuantity - requiredQuantity).toFixed(2)));
  const amount = Number((normalizedOrderQuantity * normalizedUnitPrice).toFixed(2));
  const blurActiveInput = () => {
    if (typeof document === "undefined") return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  };

  const commitConfirm = () => {
    if (!canConfirm || confirmLockRef.current) return;
    confirmLockRef.current = true;
    lastConfirmAtRef.current = Date.now();
    blurActiveInput();
    const values = {
      orderQuantity: Math.max(1, Number.isFinite(normalizedOrderQuantity) ? normalizedOrderQuantity : 0),
      unitPrice: Math.max(0, Number.isFinite(normalizedUnitPrice) ? normalizedUnitPrice : 0),
    };
    window.setTimeout(() => {
      onConfirm(values);
      window.setTimeout(() => {
        confirmLockRef.current = false;
      }, 120);
    }, 32);
  };

  const handleConfirmClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (Date.now() - lastConfirmAtRef.current < 220) return;
    commitConfirm();
  };

  const handleConfirmPointerDown = () => {
    blurActiveInput();
  };

  const handleConfirmPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    commitConfirm();
  };

  const handleConfirmTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    commitConfirm();
  };

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
        <WaflButton
          type="button"
          variant="primary"
          size="sm"
          disabled={!canConfirm}
          onPointerDown={handleConfirmPointerDown}
          onPointerUp={handleConfirmPointerUp}
          onTouchEnd={handleConfirmTouchEnd}
          onClick={handleConfirmClick}
        >
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
            <AppNumberInput
              inputMode="decimal"
              min={0}
              value={normalizedOrderQuantity}
              onValueChange={(value) => onChange({ orderQuantity: value })}
              component="material-order-line-quantity-input"
              className={WAFL_FIELD_INPUT_CLASS}
            />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <span>단가</span>
            <AppNumberInput
              inputMode="numeric"
              min={0}
              value={normalizedUnitPrice}
              onValueChange={(value) => onChange({ unitPrice: value })}
              component="material-order-line-unit-price-input"
              className={WAFL_FIELD_INPUT_CLASS}
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

