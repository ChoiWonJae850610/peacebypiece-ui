"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { WaflButton, WaflInput, WaflModalSection, WaflSurface, WaflSurfaceButton } from "@/components/common/ui";
import { formatMaterialOrderAmount } from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderLineAddModalProps = {
  open: boolean;
  itemName: string;
  unit: string;
  requiredQuantity: number;
  orderQuantity: number;
  unitPrice: number;
  onClose: () => void;
  onConfirm: (values?: { orderQuantity: number; unitPrice: number }) => void;
};

type ModalDiagnosticSnapshot = {
  reason: string;
  eventTarget: string;
  pointTarget: string;
  activeElement: string;
  viewport: string;
  scroll: string;
  dialogRect: string;
  orderRect: string;
  priceRect: string;
  closeRect: string;
  confirmRect: string;
};

function describeDiagnosticElement(value: EventTarget | Element | null) {
  if (!(value instanceof Element)) return "none";

  const component = value.getAttribute("data-wafl-component");
  const label = value.getAttribute("aria-label");
  const id = value.id ? `#${value.id}` : "";
  const marker = component ? `[${component}]` : label ? `[${label}]` : "";
  return `${value.tagName.toLowerCase()}${id}${marker}`;
}

function formatDiagnosticRect(element: Element | null) {
  if (!element) return "none";
  const rect = element.getBoundingClientRect();
  return `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
}

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
  onClose,
  onConfirm,
}: MaterialOrderLineAddModalProps) {
  const confirmLockRef = useRef(false);
  const orderQuantityInputId = useId();
  const unitPriceInputId = useId();
  const orderQuantityInputRef = useRef<HTMLInputElement | null>(null);
  const unitPriceInputRef = useRef<HTMLInputElement | null>(null);
  const [diagnosticSnapshot, setDiagnosticSnapshot] = useState<ModalDiagnosticSnapshot | null>(null);
  const [diagnosticHistory, setDiagnosticHistory] = useState<string[]>([]);
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

  const captureDiagnosticSnapshot = useCallback((reason: string, event?: Event) => {
    if (typeof document === "undefined") return;

    const portalRoot = document.getElementById("wafl-modal-portal-root");
    const dialog = portalRoot?.querySelector('[data-wafl-component="modal-panel"]') ?? null;
    const closeButton = dialog?.querySelector('[data-wafl-component="modal-header"] button') ?? null;
    const confirmButton = dialog?.querySelector('[data-wafl-component="modal-footer"] button') ?? null;

    let clientX: number | null = null;
    let clientY: number | null = null;
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
      const touch = event.changedTouches[0] ?? event.touches[0];
      clientX = touch?.clientX ?? null;
      clientY = touch?.clientY ?? null;
    }

    const pointTarget = clientX === null || clientY === null
      ? null
      : document.elementFromPoint(clientX, clientY);
    const viewport = window.visualViewport;
    const snapshot: ModalDiagnosticSnapshot = {
      reason,
      eventTarget: describeDiagnosticElement(event?.target ?? null),
      pointTarget: describeDiagnosticElement(pointTarget),
      activeElement: describeDiagnosticElement(document.activeElement),
      viewport: viewport
        ? `off=${Math.round(viewport.offsetLeft)},${Math.round(viewport.offsetTop)} size=${Math.round(viewport.width)}x${Math.round(viewport.height)}`
        : "none",
      scroll: `window=${Math.round(window.scrollX)},${Math.round(window.scrollY)}`,
      dialogRect: formatDiagnosticRect(dialog),
      orderRect: formatDiagnosticRect(orderQuantityInputRef.current),
      priceRect: formatDiagnosticRect(unitPriceInputRef.current),
      closeRect: formatDiagnosticRect(closeButton),
      confirmRect: formatDiagnosticRect(confirmButton),
    };

    setDiagnosticSnapshot(snapshot);
    setDiagnosticHistory((current) => [
      `${reason}: ${snapshot.eventTarget} -> ${snapshot.pointTarget} / active ${snapshot.activeElement}`,
      ...current,
    ].slice(0, 5));
  }, []);

  useEffect(() => {
    if (!open) {
      setDiagnosticSnapshot(null);
      setDiagnosticHistory([]);
      return;
    }

    const handlePointerDown = (event: PointerEvent) => captureDiagnosticSnapshot("pointerdown", event);
    const handleTouchStart = (event: TouchEvent) => captureDiagnosticSnapshot("touchstart", event);
    const handleClick = (event: MouseEvent) => captureDiagnosticSnapshot("click", event);
    const handleFocusIn = (event: FocusEvent) => captureDiagnosticSnapshot("focusin", event);
    const handleViewportChange = () => captureDiagnosticSnapshot("viewport");
    const handleWindowScroll = () => captureDiagnosticSnapshot("window-scroll");

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("touchstart", handleTouchStart, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("scroll", handleWindowScroll, true);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    const timer = window.setTimeout(() => captureDiagnosticSnapshot("open"), 50);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("scroll", handleWindowScroll, true);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [captureDiagnosticSnapshot, open]);

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

  const handleOrderQuantityChange = (value: string) => {
    setOrderQuantityInput(normalizeNumberInput(value, true));
  };

  const handleUnitPriceChange = (value: string) => {
    setUnitPriceInput(normalizeNumberInput(value));
  };


  return (
    <ModalShell
      open={open}
      title="발주 품목 추가 [DEBUG 0.22.22]"
      description="필요수량을 확인하고 주문수량과 단가를 입력합니다."
      onClose={onClose}
      maxWidthClass="md:max-w-lg"
      bodyClassName="grid gap-3"
      footerClassName="flex justify-end"
      lockBodyPosition={false}
      lockDocumentScroll={false}
      useNativeTouchInteractions
      centerWithoutTransform
      useSimpleInteractionLayer
      footer={
        <WaflButton
          type="button"
          variant="primary"
          size="sm"
          disabled={!canConfirm}
          onClick={commitConfirm}
        >
          추가
        </WaflButton>
      }
    >
      <div
        aria-hidden="true"
        data-wafl-component="modal-touch-diagnostic"
        className="pointer-events-none sticky top-0 z-20 max-h-[160px] min-h-[72px] overflow-hidden rounded-lg px-2 py-1.5 font-mono text-[10px] leading-4"
        style={{
          backgroundColor: "#ffeb00",
          color: "#000000",
          border: "3px solid #ff0000",
          boxShadow: "0 0 0 2px #000000",
        }}
      >
        <div className="font-semibold">WAFL MODAL DIAG 0.22.22 · {diagnosticSnapshot?.reason ?? "waiting"}</div>
        {diagnosticSnapshot ? (
          <>
            <div>event: {diagnosticSnapshot.eventTarget}</div>
            <div>point: {diagnosticSnapshot.pointTarget}</div>
            <div>active: {diagnosticSnapshot.activeElement}</div>
            <div>viewport: {diagnosticSnapshot.viewport}</div>
            <div>scroll: {diagnosticSnapshot.scroll}</div>
            <div>dialog: {diagnosticSnapshot.dialogRect}</div>
            <div>qty: {diagnosticSnapshot.orderRect}</div>
            <div>price: {diagnosticSnapshot.priceRect}</div>
            <div>close: {diagnosticSnapshot.closeRect}</div>
            <div>confirm: {diagnosticSnapshot.confirmRect}</div>
            {diagnosticHistory.slice(0, 2).map((line, index) => (
              <div key={`${line}-${index}`} className="truncate opacity-70">{line}</div>
            ))}
          </>
        ) : (
          <div>진단 이벤트 대기 중</div>
        )}
      </div>
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
          <div className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <label htmlFor={orderQuantityInputId}>주문수량</label>
            <WaflInput
              ref={orderQuantityInputRef}
              id={orderQuantityInputId}
              fieldSize="sm"
              inputMode="decimal"
              value={orderQuantityInput}
              onChange={(event) => handleOrderQuantityChange(event.target.value)}
              aria-label="주문수량"
            />
          </div>
          <div className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            <label htmlFor={unitPriceInputId}>단가</label>
            <WaflInput
              ref={unitPriceInputRef}
              id={unitPriceInputId}
              fieldSize="sm"
              inputMode="numeric"
              value={unitPriceInput}
              onChange={(event) => handleUnitPriceChange(event.target.value)}
              aria-label="단가"
            />
          </div>
          <WaflSurface component="material-order-line-add-extra" shape="control" tone="muted" className="grid content-center gap-1 px-3 py-2">
            <span className="text-[11px] font-semibold pbp-text-subtle">여유주문</span>
            <span className="text-sm font-semibold tabular-nums pbp-text-primary">{extraQuantity.toLocaleString()} {unit}</span>
          </WaflSurface>
        </div>
        <WaflSurfaceButton
          component="material-order-line-add-amount"
          shape="control"
          tone="muted"
          data-wafl-keyboard-dismiss="true"
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-semibold outline-none"
        >
          <span className="pbp-text-subtle">금액</span>
          <span className="tabular-nums pbp-text-primary">{formatMaterialOrderAmount(amount)}</span>
        </WaflSurfaceButton>
      </WaflModalSection>
    </ModalShell>
  );
}
