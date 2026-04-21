"use client";

import { useMemo } from "react";
import ModalShell from "@/components/common/ModalShell";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
import { MODAL_ACTION_LABELS } from "@/lib/constants/modal";
import { DEFAULT_UNSELECTED_OPTION, isEmptySelectionValue } from "@/lib/constants/workorderDomain";
import { useI18n } from "@/lib/i18n";
import type { WorkOrder } from "@/types/workorder";

function resolveFactoryName(workOrder: WorkOrder) {
  const factoryName = String(
    workOrder.factoryOrderRequest?.factoryName
      ?? workOrder.orderEntries?.[0]?.factory
      ?? workOrder.vendor
      ?? "",
  ).trim();

  if (!factoryName || isEmptySelectionValue(factoryName) || factoryName === DEFAULT_UNSELECTED_OPTION || factoryName === "선택안함") {
    return "";
  }

  return factoryName;
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
  const requested = workOrder.factoryOrderRequest ?? null;
  const confirmedFactoryName = useMemo(() => resolveFactoryName(workOrder), [workOrder]);
  const confirmedDueDate = String(workOrder.orderEntries?.[0]?.dueDate ?? workOrder.dueDate ?? "").trim();
  const confirmedQuantity = Math.max(0, Number(workOrder.orderEntries?.[0]?.quantity ?? workOrder.quantity ?? 0) || 0);
  const canSubmit = Boolean(confirmedFactoryName) && Boolean(confirmedDueDate) && confirmedQuantity > 0 && !requested;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-lg"
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
      <div className="space-y-3 text-sm text-stone-700">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-2">
          <span className="text-stone-500">{copy.factoryFieldLabel ?? "공장"}</span>
          <span className="text-right font-medium text-stone-900">{confirmedFactoryName || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-2">
          <span className="text-stone-500">{copy.dueDateFieldLabel ?? "납기일"}</span>
          <span className="text-right font-medium text-stone-900">{confirmedDueDate || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-2">
          <span className="text-stone-500">{copy.quantityFieldLabel ?? "수량"}</span>
          <span className="text-right font-medium text-stone-900">{copy.quantityFormat.replace("{count}", confirmedQuantity.toLocaleString())}</span>
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
