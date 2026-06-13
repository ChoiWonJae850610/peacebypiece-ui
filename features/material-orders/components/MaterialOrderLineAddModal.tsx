"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
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
  onConfirm: (values?: { orderQuantity: number; unitPrice: number }) => void;
};

function parseNumberInput(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberInput(value: number) {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString();
}

function normalizeNumberInput(value: string, allowDecimal = false) {
  const stripped = value
    .replace(/,/g, "")
    .replace(allowDecimal ? /[^\d.]/g : /\D/g, "");

  if (!stripped) return "";

  const [integerPart, ...decimalParts] = stripped.split(".");
  const safeIntegerPart = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const formattedIntegerPart = Number(safeIntegerPart).toLocaleString();

  if (!allowDecimal || decimalParts.length === 0) {
    return formattedIntegerPart;
  }

  const decimalPart = decimalParts.join("").slice(0, 2);
  return `${formattedIntegerPart}.${decimalPart}`;
}

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
  const [orderQuantityInput, setOrderQuantityInput] = useState(() => formatNumberInput(orderQuantity));
  const [unitPriceInput, setUnitPriceInput] = useState(() => formatNumberInput(unitPrice));

  useEffect(() => {
    if (!open) {
      confirmLockRef.current = false;
      return;
    }

    setOrderQuantityInput(formatNumberInput(orderQuantity));
    setUnitPriceInput(formatNumberInput(unitPrice));
    confirmLockRef.current = false;
  }, [open, orderQuantity, unitPrice]);

  const parsedValues = useMemo(() => {
    const parsedOrderQuantity = parseNumberInput(orderQuantityInput);
    const parsedUnitPrice = parseNumberInput(unitPriceInput);

    return {
      orderQuantity: Number.isFinite(parsedOrderQuantity) ? parsedOrderQuantity : 0,
      unitPrice: Number.isFinite(parsedUnitPrice) ? parsedUnitPrice : 0,
    };
  }, [orderQuantityInput, unitPriceInput]);

  const canConfirm = parsedValues.orderQuantity >= 1;
  const extraQuantity = Math.max(0, Number((parsedValues.orderQuantity - requiredQuantity).toFixed(2)));
  const amount = Number((parsedValues.orderQuantity * parsedValues.unitPrice).toFixed(2));

  const blurActiveInput = () => {
    if (typeof document === "undefined") return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  };

  const syncParsedValues = () => {
    onChange({
      orderQuantity: parsedValues.orderQuantity,
      unitPrice: parsedValues.unitPrice,
    });
  };

  const commitConfirm = () => {
    if (!canConfirm || confirmLockRef.current) return;
    confirmLockRef.current = true;
    blurActiveInput();

    const values = {
      orderQuantity: Math.max(1, parsedValues.orderQuantity),
      unitPrice: Math.max(0, parsedValues.unitPrice),
    };

    onChange(values);
    onConfirm(values);

    window.setTimeout(() => {
      confirmLockRef.current = false;
    }, 160);
  };

  const handleConfirmPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") return;
    blurActiveInput();
  };

  const handleConfirmClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    commitConfirm();
  };

  const handleOrderQuantityChange = (value: string) => {
    setOrderQuantityInput(normalizeNumberInput(value, true));
  };

  const handleUnitPriceChange = (value: string) => {
    setUnitPriceInput(normalizeNumberInput(value));
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
      lockBodyPosition={false}
      rootClassName="z-[6000]"
      panelClassName="touch-auto"
      footer={
        <WaflButton
          type="button"
          variant="primary"
          size="sm"
          disabled={!canConfirm}
          onPointerDown={handleConfirmPointerDown}
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
            <WaflInput
              fieldSize="sm"
              inputMode="decimal"
              value={orderQuantityInput}
              onChange={(event) => handleOrderQuantityChange(event.target.value)}
              onBlur={syncParsedValues}
              aria-label="주문수량"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <span>단가</span>
            <WaflInput
              fieldSize="sm"
              inputMode="numeric"
              value={unitPriceInput}
              onChange={(event) => handleUnitPriceChange(event.target.value)}
              onBlur={syncParsedValues}
              aria-label="단가"
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
