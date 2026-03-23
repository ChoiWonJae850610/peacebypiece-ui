"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InventoryMode = "입고" | "차감" | "보정";

type InventoryLog = {
  id: string;
  type: InventoryMode;
  delta: number;
  memo: string;
  user: string;
  time: string;
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("inert") && !element.getAttribute("aria-hidden"));
}

export default function InventoryEditor({
  open,
  onClose,
  currentStock,
  currentUserName,
  logs,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  currentStock: number;
  currentUserName: string;
  logs: InventoryLog[];
  onApply: (payload: { type: InventoryMode; quantity: number; memo: string }) => void;
}) {
  const [mode, setMode] = useState<InventoryMode>("입고");
  const [quantity, setQuantity] = useState<string>("");
  const [memo, setMemo] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("입고");
      setQuantity("");
      setMemo("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(dialog);
      (focusables[0] ?? dialog).focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [open, onClose]);

  const parsedQuantity = Number(quantity || 0);
  const nextStock = useMemo(() => {
    if (!parsedQuantity) return currentStock;
    if (mode === "입고") return currentStock + parsedQuantity;
    if (mode === "차감") return Math.max(0, currentStock - parsedQuantity);
    return parsedQuantity;
  }, [currentStock, mode, parsedQuantity]);

  if (!open) return null;

  const handleApply = () => {
    if (!parsedQuantity || parsedQuantity < 0) return;
    onApply({ type: mode, quantity: parsedQuantity, memo: memo.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="inventory-editor-title">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-3xl border border-stone-200 bg-white p-4 shadow-2xl outline-none md:left-1/2 md:top-1/2 md:bottom-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div id="inventory-editor-title" className="text-lg font-semibold text-stone-900">재고 수정</div>
            <div className="mt-1 text-sm text-stone-500">모바일은 드로어, PC는 모달처럼 동작합니다.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">
            닫기
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs text-stone-500">현재 재고</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{currentStock}장</div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
            <div className="text-xs text-cyan-700">반영 후 예상</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-cyan-900">{nextStock}장</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["입고", "차감", "보정"] as InventoryMode[]).map((item) => {
            const active = item === mode;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">수량</label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={mode === "보정" ? "최종 재고 수량 입력" : "수량 입력"}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="입고 사유, 차감 사유, 보정 메모"
              rows={3}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
            <div>
              수정자: <span className="font-medium text-stone-900">{currentUserName}</span>
            </div>
            <div className="mt-1 text-xs text-stone-500">현재는 로컬 상태 기반 테스트 단계입니다.</div>
          </div>
        </div>

        <div className="mt-5 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">최근 수정</div>
            <span className="text-xs text-stone-500">최근 {Math.min(logs.length, 3)}건</span>
          </div>
          <div className="mt-3 space-y-2">
            {logs.length > 0 ? (
              logs.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-stone-900">{item.type} {item.delta > 0 ? `+${item.delta}` : item.delta}</span>
                    <span className="text-xs text-stone-500">{item.time}</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{item.user}</div>
                  <div className="mt-1 text-sm text-stone-700">{item.memo || "메모 없음"}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-500">아직 수정 이력이 없습니다.</div>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800">
            취소
          </button>
          <button type="button" onClick={handleApply} className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50" disabled={!parsedQuantity && mode !== "보정"}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
