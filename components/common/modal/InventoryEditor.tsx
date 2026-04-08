"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";

type InventoryMode = "입고" | "차감" | "보정";

type InventoryLog = {
  id: string;
  summary: string;
  delta: number;
  memo: string;
  user: string;
  time: string;
  changes: Array<{
    type: InventoryMode;
    quantity: number;
  }>;
};

export default function InventoryEditor({
  open,
  onClose,
  currentStock,
  currentUserName,
  logs,
  showRecentLogs,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  currentStock: number;
  currentUserName: string;
  logs: InventoryLog[];
  showRecentLogs: boolean;
  onApply: (payload: {
    inboundQuantity: number;
    adjustmentQuantity: number;
    deductionQuantity: number;
    memo: string;
  }) => void;
}) {
  const [inboundQuantity, setInboundQuantity] = useState<string>("");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>("");
  const [deductionQuantity, setDeductionQuantity] = useState<string>("");
  const [memo, setMemo] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setInboundQuantity("");
      setAdjustmentQuantity("");
      setDeductionQuantity("");
      setMemo("");
    }
  }, [open]);

  useModalEnvironment({ open, dialogRef, onClose });

  const parsedInboundQuantity = Number(inboundQuantity || 0);
  const parsedAdjustmentQuantity = Number(adjustmentQuantity || 0);
  const parsedDeductionQuantity = Number(deductionQuantity || 0);
  const hasAnyChange = parsedInboundQuantity > 0 || parsedAdjustmentQuantity > 0 || parsedDeductionQuantity > 0;

  const nextStock = useMemo(() => {
    let next = currentStock;
    if (parsedInboundQuantity > 0) next += parsedInboundQuantity;
    if (parsedDeductionQuantity > 0) next = Math.max(0, next - parsedDeductionQuantity);
    if (parsedAdjustmentQuantity > 0) next = parsedAdjustmentQuantity;
    return next;
  }, [currentStock, parsedInboundQuantity, parsedAdjustmentQuantity, parsedDeductionQuantity]);

  const handleApply = () => {
    if (!hasAnyChange) return;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onApply({
      inboundQuantity: parsedInboundQuantity,
      adjustmentQuantity: parsedAdjustmentQuantity,
      deductionQuantity: parsedDeductionQuantity,
      memo: memo.trim(),
    });
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="inventory-editor-title" maxWidthClassName="md:max-w-lg">
      <ModalHeader
        titleId="inventory-editor-title"
        title="재고 수정"
        description={undefined}
        onClose={onClose}
      />

      <ModalBody>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs text-stone-500">현재 재고</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{currentStock}장</div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
            <div className="text-xs text-cyan-700">반영 후 예상</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-cyan-900">{nextStock}장</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">입고 수량</label>
              <input
                type="number"
                min={0}
                value={inboundQuantity}
                onChange={(event) => setInboundQuantity(event.target.value)}
                placeholder="입고 수량 입력"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">보정 수량</label>
              <input
                type="number"
                min={0}
                value={adjustmentQuantity}
                onChange={(event) => setAdjustmentQuantity(event.target.value)}
                placeholder="최종 재고 수량"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">차감 수량</label>
              <input
                type="number"
                min={0}
                value={deductionQuantity}
                onChange={(event) => setDeductionQuantity(event.target.value)}
                placeholder="차감 수량 입력"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">메모</label>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="입고 사유, 차감 사유, 보정 메모"
              rows={3}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
            />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
            <div>
              수정자: <span className="font-medium text-stone-900">{currentUserName}</span>
            </div>
            <div className="mt-1 text-xs text-stone-500">현재는 로컬 상태 기반 테스트 단계입니다.</div>
          </div>
        </div>

        {showRecentLogs ? (
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
                    <span className="font-medium text-stone-900">{item.summary}</span>
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
        ) : null}
      </ModalBody>

      <ModalFooter>
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
            disabled={!hasAnyChange}
          >
            적용
          </button>
        </div>
      </ModalFooter>
    </BaseModal>
  );
}
