"use client";

import { useMemo } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
import { MODAL_ACTION_LABELS } from "@/components/common/modal/modalActions";
import {
  getOrderSubmissionSnapshot,
  getRepresentativeOrderEntryFromWorkOrder,
} from "@/lib/workorder/orderSubmission";
import { useI18n } from "@/lib/i18n";
import {
  ORDER_ENTRY_TARGET_TYPE,
  ORDER_ENTRY_TARGET_TYPE_LABELS,
  type OrderEntryTargetTypeValue,
} from "@/lib/constants/workorderDomain";
import type { WorkOrder } from "@/types/workorder";

const ORDER_REQUEST_SECTION_TYPES: OrderEntryTargetTypeValue[] = [
  ORDER_ENTRY_TARGET_TYPE.factory,
  ORDER_ENTRY_TARGET_TYPE.fabric,
  ORDER_ENTRY_TARGET_TYPE.subsidiary,
];

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
  const requested = workOrder.factoryOrderRequest ?? null;
  const submissionSnapshot = useMemo(() => getOrderSubmissionSnapshot(workOrder), [workOrder]);
  const confirmedFactoryName = requested?.factoryName?.trim() || submissionSnapshot.factoryName;
  const confirmedDueDate = submissionSnapshot.dueDate;
  const confirmedQuantity = requested?.quantity ?? submissionSnapshot.quantity;
  const canSubmit = Boolean(confirmedFactoryName) && Boolean(confirmedDueDate) && confirmedQuantity > 0 && !requested;

  const sections = useMemo(
    () =>
      ORDER_REQUEST_SECTION_TYPES.map((targetType) => {
        const entry = getRepresentativeOrderEntryFromWorkOrder(workOrder, targetType);
        const isFactory = targetType === ORDER_ENTRY_TARGET_TYPE.factory;

        return {
          targetType,
          title: ORDER_ENTRY_TARGET_TYPE_LABELS[targetType],
          factoryName: isFactory ? confirmedFactoryName : entry?.factory?.trim() || "",
          dueDate: isFactory ? confirmedDueDate : entry?.dueDate?.trim() || "",
          quantity: isFactory ? confirmedQuantity : Number(entry?.quantity ?? 0),
        };
      }),
    [confirmedDueDate, confirmedFactoryName, confirmedQuantity, workOrder],
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-2xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
      bodyClassName="space-y-4 bg-stone-50"
      footer={renderModalFooterActions({
        layout: "stack-reverse",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, className: "transition py-2.5" },
        primary: {
          label: requested ? (copy.requestedBadge ?? "발주 완료") : MODAL_ACTION_LABELS.proceedOrderRequest,
          onClick: () => onConfirm({ factoryName: confirmedFactoryName, quantity: confirmedQuantity }),
          tone: "primary",
          disabled: !canSubmit,
          className: "transition py-2.5",
        },
      })}
    >
      <div className="space-y-4 text-sm text-stone-700">
        <div className="grid gap-3 md:grid-cols-3">
          {sections.map((section) => (
            <section
              key={section.targetType}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-stone-100 pb-2">
                <h3 className="text-sm font-semibold text-stone-900">{section.title}</h3>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                  {section.title}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-stone-500">{copy.factoryFieldLabel ?? "업체"}</span>
                  <span className="text-right font-medium text-stone-900">{section.factoryName || "-"}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-stone-500">{copy.dueDateFieldLabel ?? "납기일"}</span>
                  <span className="text-right font-medium text-stone-900">{section.dueDate || "-"}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-stone-500">{copy.quantityFieldLabel ?? "수량"}</span>
                  <span className="text-right font-medium text-stone-900">
                    {section.quantity > 0 ? copy.quantityFormat.replace("{count}", section.quantity.toLocaleString()) : "-"}
                  </span>
                </div>
              </div>
            </section>
          ))}
        </div>

        {requested ? (
          <div className="text-sm text-emerald-700">
            {copy.requestedNotice ?? "이미 발주 요청이 기록된 작업입니다. 중복 발주는 허용되지 않습니다."}
          </div>
        ) : (
          <div className="text-xs text-stone-500">
            {copy.confirmNotice ?? "수정이 필요하면 모달을 닫고 발주정보에서 먼저 수정해주세요."}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
