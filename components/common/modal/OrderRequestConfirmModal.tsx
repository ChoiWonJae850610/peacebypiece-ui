"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { ORDER_REQUEST_TABLE_COLUMNS } from "@/lib/constants/workorderDomain";
import { useI18n } from "@/lib/i18n";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import type { WorkOrder } from "@/types/workorder";

function getFactoryOptions(workOrder: WorkOrder) {
  const fromEntries = (workOrder.orderEntries ?? []).map((item) => String(item.factory ?? "").trim()).filter(Boolean);
  const fromRequest = workOrder.factoryOrderRequest?.factoryName ? [workOrder.factoryOrderRequest.factoryName] : [];
  return [...new Set([...fromRequest, ...fromEntries])];
}

export default function OrderRequestConfirmModal({
  open,
  workOrder,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workOrder: WorkOrder;
  onClose: () => void;
  onConfirm: (payload: { factoryName: string; quantity: number }) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.orderRequestConfirm;
  const officialAttachments = (workOrder.attachments ?? []).filter((attachment) => (attachment.scope ?? "official") === "official");
  const attachmentCount = officialAttachments.length;
  const attachmentSummary = attachmentCount > 0 ? copy.attachmentCountFormat.replace("{count}", String(attachmentCount)) : copy.noAttachments;
  const orderEntries = workOrder.orderEntries ?? [{
    id: `${workOrder.id}-legacy-order`,
    type: copy.defaultOrderType,
    factory: workOrder.vendor || "-",
    dueDate: workOrder.dueDate || "",
    quantity: workOrder.quantity || 0,
    laborCost: workOrder.laborCost || 0,
    lossCost: workOrder.lossCost || 0,
  }];
  const totalQuantity = orderEntries.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const factoryOptions = useMemo(() => getFactoryOptions(workOrder), [workOrder]);
  const requested = workOrder.factoryOrderRequest ?? null;
  const [factoryName, setFactoryName] = useState(requested?.factoryName ?? factoryOptions[0] ?? "");
  const [quantityInput, setQuantityInput] = useState(String(requested?.quantity ?? totalQuantity));

  useEffect(() => {
    if (!open) return;
    setFactoryName(requested?.factoryName ?? factoryOptions[0] ?? "");
    setQuantityInput(String(requested?.quantity ?? totalQuantity));
  }, [factoryOptions, open, requested?.factoryName, requested?.quantity, totalQuantity]);

  const normalizedQuantity = Math.max(0, Number(quantityInput.replace(/,/g, "")) || 0);
  const canSubmit = factoryName.trim().length > 0 && normalizedQuantity > 0 && !requested;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-2xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
      bodyClassName="space-y-4 bg-stone-50 md:space-y-5"
      footer={renderModalFooterActions({
        layout: "stack-reverse",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, className: "transition py-2.5" },
        primary: {
          label: requested ? "발주 완료" : MODAL_ACTION_LABELS.proceedOrderRequest,
          onClick: () => onConfirm({ factoryName: factoryName.trim(), quantity: normalizedQuantity }),
          tone: "primary",
          disabled: !canSubmit,
          className: "transition py-2.5",
        },
      })}
    >
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="text-sm font-semibold text-stone-900">작업지시서 요약</div>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-stone-600 md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-stone-400">{copy.workOrderNameLabel}</dt>
            <dd className="mt-1 font-medium text-stone-900">{getWorkOrderDisplayTitle(workOrder)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-400">{copy.managerLabel}</dt>
            <dd className="mt-1 font-medium text-stone-900">{workOrder.manager || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-400">{copy.orderCountLabel}</dt>
            <dd className="mt-1 font-medium text-stone-900">{copy.orderCountFormat.replace("{count}", String(orderEntries.length))}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-400">{copy.totalQuantityLabel}</dt>
            <dd className="mt-1 font-medium text-stone-900">{copy.quantityFormat.replace("{count}", totalQuantity.toLocaleString())}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="text-sm font-semibold text-stone-900">공장 발주</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-stone-500">공장 선택</span>
            <select
              value={factoryName}
              onChange={(event) => setFactoryName(event.target.value)}
              disabled={Boolean(requested)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 disabled:bg-stone-100 disabled:text-stone-500"
            >
              <option value="">공장 선택</option>
              {factoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-stone-500">발주 수량</span>
            <input
              type="number"
              min={0}
              step={1}
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              disabled={Boolean(requested)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 disabled:bg-stone-100 disabled:text-stone-500"
            />
          </label>
        </div>
        {requested ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            {`${requested.factoryName} / ${requested.quantity.toLocaleString()}장 / ${requested.requestedBy}`}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-stone-900">{copy.orderInfoTitle}</div>
          <div className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{copy.orderInfoCountFormat.replace("{count}", String(orderEntries.length))}</div>
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
                {ORDER_REQUEST_TABLE_COLUMNS.map((column) => (
                  <th key={column.key} className={`px-3 py-2 font-medium ${column.align === "right" ? "text-right" : "text-left"}`}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderEntries.map((item) => (
                <tr key={item.id} className="border-t border-stone-200 text-stone-800">
                  <td className="px-3 py-2">{item.type}</td>
                  <td className="px-3 py-2">{item.factory || "-"}</td>
                  <td className="px-3 py-2">{item.dueDate || "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{copy.quantityFormat.replace("{count}", item.quantity.toLocaleString())}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{copy.currencyFormat.replace("{amount}", item.laborCost.toLocaleString())}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{copy.currencyFormat.replace("{amount}", item.lossCost.toLocaleString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-stone-900">{copy.attachmentTitle}</div>
          <div className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{attachmentSummary}</div>
        </div>
        {attachmentCount > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {officialAttachments.map((attachment) => (
              <li key={attachment.id} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="font-medium text-stone-900">{attachment.name}</div>
                <div className="mt-1 text-xs text-stone-500">{attachment.type === "pdf" ? "PDF" : copy.imageType}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-700">
            {copy.noAttachmentNotice}
          </div>
        )}
      </section>
    </ModalShell>
  );
}
