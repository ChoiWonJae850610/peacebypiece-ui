"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { AppSheet, WaflButton, WaflInput, WaflModalSection, WaflSurface, WaflSurfaceButton } from "@/components/common/ui";
import { formatMaterialOrderAmount } from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderLineAddDrawerProps = {
  open: boolean;
  itemName: string;
  unit: string;
  requiredQuantity: number;
  orderQuantity: number;
  unitPrice: number;
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

export default function MaterialOrderLineAddDrawer({
  open,
  itemName,
  unit,
  requiredQuantity,
  orderQuantity,
  unitPrice,
  onClose,
  onConfirm,
}: MaterialOrderLineAddDrawerProps) {
  const confirmLockRef = useRef(false);
  const orderQuantityInputId = useId();
  const unitPriceInputId = useId();
  const [orderQuantityInput, setOrderQuantityInput] = useState(() => formatNumberInput(orderQuantity));
  const [unitPriceInput, setUnitPriceInput] = useState(() => formatNumberInput(unitPrice));
  const [nativeControlledInput, setNativeControlledInput] = useState("");

  useEffect(() => {
    if (!open) {
      confirmLockRef.current = false;
      return;
    }

    setOrderQuantityInput(formatNumberInput(orderQuantity));
    setUnitPriceInput(formatNumberInput(unitPrice));
    setNativeControlledInput("");
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

  const commitConfirm = () => {
    if (!canConfirm || confirmLockRef.current) return;
    confirmLockRef.current = true;

    onConfirm({
      orderQuantity: parsedValues.orderQuantity,
      unitPrice: Math.max(0, parsedValues.unitPrice),
    });
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="C. AppSheet 드로어 테스트"
      description="C 환경입니다. AppSheet와 portal을 사용하는 오른쪽 드로어입니다."
      side="right"
      size="md"
      contentClassName="grid content-start gap-3"
      footer={
        <div className="flex justify-end">
          <WaflButton type="button" variant="primary" size="sm" disabled={!canConfirm} onClick={commitConfirm}>
            추가
          </WaflButton>
        </div>
      }
    >
      <WaflModalSection className="grid gap-3">
        <div
          className="grid gap-3 border-4 border-amber-600 bg-yellow-200 p-3 text-black"
          data-wafl-focus-diagnostic="true"
        >
          <div>
            <p className="text-sm font-black">C. APPSHEET 입력 포커스 테스트</p>
            <p className="mt-1 text-[11px] leading-4">현재 AppSheet/portal 드로어 환경입니다. 세 입력칸을 번갈아 누르고 키보드를 닫은 뒤, 헤더·닫기·추가 버튼도 눌러 비교합니다.</p>
          </div>

          <div className="grid gap-1">
            <label htmlFor="wafl-focus-test" className="text-[11px] font-semibold">1. WAFL 제어형 입력</label>
            <WaflInput
              id="wafl-focus-test"
              fieldSize="sm"
              inputMode="numeric"
              value={unitPriceInput}
              onChange={(event) => setUnitPriceInput(normalizeNumberInput(event.target.value))}
              aria-label="WAFL 제어형 입력 테스트"
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="native-controlled-focus-test" className="text-[11px] font-semibold">2. 기본 HTML 제어형 입력</label>
            <input
              id="native-controlled-focus-test"
              inputMode="numeric"
              value={nativeControlledInput}
              onChange={(event) => setNativeControlledInput(event.target.value)}
              aria-label="기본 HTML 제어형 입력 테스트"
              style={{
                display: "block",
                width: "100%",
                minHeight: 40,
                border: "1px solid #111827",
                borderRadius: 4,
                background: "#ffffff",
                color: "#111827",
                padding: "8px 10px",
                fontSize: 16,
              }}
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="native-uncontrolled-focus-test" className="text-[11px] font-semibold">3. 기본 HTML 비제어형 입력</label>
            <input
              id="native-uncontrolled-focus-test"
              inputMode="numeric"
              defaultValue=""
              aria-label="기본 HTML 비제어형 입력 테스트"
              style={{
                display: "block",
                width: "100%",
                minHeight: 40,
                border: "1px solid #111827",
                borderRadius: 4,
                background: "#ffffff",
                color: "#111827",
                padding: "8px 10px",
                fontSize: 16,
              }}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold pbp-text-subtle">품목</p>
          <p className="mt-1 text-sm font-semibold pbp-text-primary">{itemName || "품목명 미입력"}</p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <span>필요수량</span>
            <WaflInput fieldSize="sm" value={`${requiredQuantity.toLocaleString()} ${unit}`} disabled />
          </label>

          <div className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <label htmlFor={orderQuantityInputId}>주문수량</label>
            <WaflInput
              id={orderQuantityInputId}
              fieldSize="sm"
              inputMode="decimal"
              value={orderQuantityInput}
              onChange={(event) => setOrderQuantityInput(normalizeNumberInput(event.target.value, true))}
              aria-label="주문수량"
            />
          </div>

          <div className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <label htmlFor={unitPriceInputId}>단가</label>
            <WaflInput
              id={unitPriceInputId}
              fieldSize="sm"
              inputMode="numeric"
              value={unitPriceInput}
              onChange={(event) => setUnitPriceInput(normalizeNumberInput(event.target.value))}
              aria-label="단가"
            />
          </div>

          <WaflSurface component="material-order-line-add-drawer-extra" shape="control" tone="muted" className="grid content-center gap-1 px-3 py-2">
            <span className="text-[11px] font-semibold pbp-text-subtle">여유주문</span>
            <span className="text-sm font-semibold tabular-nums pbp-text-primary">{extraQuantity.toLocaleString()} {unit}</span>
          </WaflSurface>
        </div>

        <WaflSurfaceButton
          component="material-order-line-add-drawer-amount"
          shape="control"
          tone="muted"
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-semibold outline-none"
        >
          <span className="pbp-text-subtle">금액</span>
          <span className="tabular-nums pbp-text-primary">{formatMaterialOrderAmount(amount)}</span>
        </WaflSurfaceButton>
      </WaflModalSection>
    </AppSheet>
  );
}
