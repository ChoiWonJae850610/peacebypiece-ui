"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { WorkOrder } from "@/types/workorder";

export default function OrderRequestConfirmModal({
  open,
  workOrder,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workOrder: WorkOrder;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({ open, dialogRef, onClose });

  const attachmentCount = workOrder.attachments?.length ?? 0;
  const attachmentSummary = attachmentCount > 0 ? `${attachmentCount}개 첨부됨` : "첨부파일 없음";

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="order-request-confirm-title"
      maxWidthClassName="md:max-w-2xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
    >
      <ModalHeader
        titleId="order-request-confirm-title"
        title="발주 요청 확인"
        description="발주 요청 시 즉시 생산 단계로 전환됩니다."
        onClose={onClose}
      />

      <ModalBody className="space-y-4 bg-stone-50 md:space-y-5">
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="text-sm font-semibold text-stone-900">작업지시서 요약</div>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-stone-600 md:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-stone-400">작업명</dt>
              <dd className="mt-1 font-medium text-stone-900">{workOrder.title}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-400">담당자</dt>
              <dd className="mt-1 font-medium text-stone-900">{workOrder.manager || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-400">공장</dt>
              <dd className="mt-1 font-medium text-stone-900">{workOrder.vendor || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-400">납기</dt>
              <dd className="mt-1 font-medium text-stone-900">{workOrder.dueDate || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-400">수량</dt>
              <dd className="mt-1 font-medium text-stone-900">{workOrder.quantity.toLocaleString()}장</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-400">우선순위</dt>
              <dd className="mt-1 font-medium text-stone-900">{workOrder.priority || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">첨부 확인</div>
            <div className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{attachmentSummary}</div>
          </div>
          {attachmentCount > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {workOrder.attachments.map((attachment) => (
                <li key={attachment.id} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="font-medium text-stone-900">{attachment.name}</div>
                  <div className="mt-1 text-xs text-stone-500">{attachment.type === "pdf" ? "PDF" : "이미지"}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-700">
              첨부파일이 없습니다. 현재 상태로 발주 요청을 진행할 수 있습니다.
            </div>
          )}
        </section>
      </ModalBody>

      <ModalFooter>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            발주 요청 진행
          </button>
        </div>
      </ModalFooter>
    </BaseModal>
  );
}
