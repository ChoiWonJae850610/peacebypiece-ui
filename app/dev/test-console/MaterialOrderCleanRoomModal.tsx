"use client";

import { createPortal } from "react-dom";

type MaterialOrderCleanRoomModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function MaterialOrderCleanRoomModal({
  open,
  onClose,
}: MaterialOrderCleanRoomModalProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[400] grid place-items-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-order-clean-room-modal-title"
        className="grid w-full max-w-lg gap-4 rounded-md border border-slate-300 bg-white p-5 text-slate-950"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p id="material-order-clean-room-modal-title" className="text-base font-bold">
              새 최소 모달 테스트
            </p>
            <p className="mt-1 text-xs text-slate-600">
              공통 모달, AppSheet, focus trap, viewport 보정을 사용하지 않습니다.
            </p>
          </div>
          <button
            type="button"
            className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold"
            onClick={onClose}
          >
            닫기
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold">
            주문수량
            <input
              inputMode="decimal"
              aria-label="새 최소 모달 주문수량"
              className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
              defaultValue=""
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold">
            단가
            <input
              inputMode="numeric"
              aria-label="새 최소 모달 단가"
              className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
              defaultValue=""
            />
          </label>
        </div>

        <div className="min-h-28 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
          빈 영역입니다. 입력 전환, 키보드 닫기, 다시 입력, 닫기를 반복합니다.
        </div>

        <footer className="flex justify-end">
          <button
            type="button"
            className="min-h-10 rounded-md border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white"
            onClick={onClose}
          >
            닫기 테스트
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
