"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalFocusTrap } from "@/components/common/modal/modalUtils";

type InventoryMode = "입고" | "차감" | "보정";

type InventoryLog = {
  id: string;
  type: InventoryMode;
  delta: number;
  memo: string;
  user: string;
  time: string;
};

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
  onApply: (payload: {
    type: InventoryMode;
    quantity: number;
    memo: string;
  }) => void;
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

  useModalFocusTrap({ open, dialogRef, onClose });

  const parsedQuantity = Number(quantity || 0);
  const nextStock = useMemo(() => {
    if (!parsedQuantity) return currentStock;
    if (mode === "입고") return currentStock + parsedQuantity;
    if (mode === "차감") return Math.max(0, currentStock - parsedQuantity);
    return parsedQuantity;
  }, [currentStock, mode, parsedQuantity]);

  const handleApply = () => {
    if (!parsedQuantity || parsedQuantity < 0) return;
    onApply({ type: mode, quantity: parsedQuantity, memo: memo.trim() });
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="inventory-editor-title"
      maxWidthClassName="md:max-w-lg"
    >
      <ModalHeader
        titleId="inventory-editor-title"
        title="재고 수정"
        description="입고, 차감, 보정 기준으로 재고를 수정하는 화면입니다."
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs text-stone-500">현재 재고</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-stone-900">
              {currentStock}장
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
            <div className="text-xs text-cyan-700">반영 후 예상</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-cyan-900">
              {nextStock}장
            </div>
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
            <label className="mb-2 block text-sm font-medium text-stone-700">
              수량
            </label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder={mode === "보정" ? "최종 재고 수량 입력" : "수량 입력"}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              메모
            </label>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="입고 사유, 차감 사유, 보정 메모"
              rows={3}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
            <div>
              수정자:{" "}
              <span className="font-medium text-stone-900">
                {currentUserName}
              </span>
            </div>
            <div className="mt-1 text-xs text-stone-500">
              현재는 로컬 상태 기반 테스트 단계입니다.
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">
              최근 수정
            </div>
            <span className="text-xs text-stone-500">
              최근 {Math.min(logs.length, 3)}건
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {logs.length > 0 ? (
              logs.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-stone-200 bg-white p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-stone-900">
                      {item.type} {item.delta > 0 ? `+${item.delta}` : item.delta}
                    </span>
                    <span className="text-xs text-stone-500">{item.time}</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{item.user}</div>
                  <div className="mt-1 text-sm text-stone-700">
                    {item.memo || "메모 없음"}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-500">
                아직 수정 이력이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-4 md:px-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            disabled={!parsedQuantity && mode !== "보정"}
          >
            적용
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
