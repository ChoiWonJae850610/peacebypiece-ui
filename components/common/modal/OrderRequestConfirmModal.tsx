"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
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
  const officialAttachments = (workOrder.attachments ?? []).filter((attachment) => (attachment.scope ?? "official") === "official");
  const attachmentCount = officialAttachments.length;
  const attachmentSummary = attachmentCount > 0 ? `${attachmentCount}개 첨부됨` : "첨부파일 없음";
  const orderEntries = workOrder.orderEntries ?? [{
    id: `${workOrder.id}-legacy-order`,
    type: "메인 생산",
    factory: workOrder.vendor || "-",
    dueDate: workOrder.dueDate || "",
    quantity: workOrder.quantity || 0,
    laborCost: workOrder.laborCost || 0,
    lossCost: workOrder.lossCost || 0,
  }];
  const totalQuantity = orderEntries.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="발주 요청 확인"
      description="발주 요청 시 즉시 생산 단계로 전환됩니다."
      maxWidthClass="md:max-w-2xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
      bodyClassName="space-y-4 bg-stone-50 md:space-y-5"
      footer={renderModalFooterActions({
        layout: "stack-reverse",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, className: "transition py-2.5" },
        primary: { label: MODAL_ACTION_LABELS.proceedOrderRequest, onClick: onConfirm, tone: "primary", className: "transition py-2.5" },
      })}
    >
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
              <dt className="text-xs font-medium text-stone-400">발주 건수</dt>
              <dd className="mt-1 font-medium text-stone-900">{orderEntries.length}건</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-400">총 수량</dt>
              <dd className="mt-1 font-medium text-stone-900">{totalQuantity.toLocaleString()}장</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">발주 정보</div>
            <div className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{orderEntries.length}개 공정/공장</div>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-stone-200">
            <table className="w-full table-fixed text-left text-xs md:text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  {['구분', '공장', '납기일', '수량', '공임비', '로스비'] .map((header) => (
                    <th key={header} className={`px-3 py-2 font-medium ${header === '수량' || header === '공임비' || header === '로스비' ? 'text-right' : 'text-left'}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderEntries.map((item) => (
                  <tr key={item.id} className="border-t border-stone-200 text-stone-800">
                    <td className="px-3 py-2">{item.type}</td>
                    <td className="px-3 py-2">{item.factory || '-'}</td>
                    <td className="px-3 py-2">{item.dueDate || '-'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.quantity.toLocaleString()}장</td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.laborCost.toLocaleString()}원</td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.lossCost.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">첨부 확인</div>
            <div className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{attachmentSummary}</div>
          </div>
          {attachmentCount > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {officialAttachments.map((attachment) => (
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
    </ModalShell>
  );
}
