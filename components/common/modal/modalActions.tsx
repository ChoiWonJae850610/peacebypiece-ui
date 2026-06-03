import type { ReactNode } from "react";
import { WaflButton, type WaflButtonVariant } from "@/components/common/ui/WaflButton";

import { getI18n } from "@/lib/i18n";

const i18n = getI18n();

export const MODAL_ACTION_LABELS = {
  cancel: i18n.common.ui.common.cancel,
  close: i18n.common.ui.common.close,
  apply: i18n.common.ui.common.apply,
  create: i18n.common.ui.common.create,
  delete: i18n.common.ui.common.delete,
  completeInspection: i18n.common.ui.modalActions.completeInspection,
  proceedOrderRequest: i18n.common.ui.modalActions.proceedOrderRequest,
  exportPdf: i18n.common.ui.modalActions.exportPdf,
} as const;

type ModalActionTone = "neutral" | "primary" | "danger";
type ModalActionWidth = "auto" | "fill";
type ModalFooterLayout = "end" | "split" | "stack-reverse";

type ModalActionButtonConfig = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: ModalActionTone;
  width?: ModalActionWidth;
  className?: string;
};

const WIDTH_CLASS_MAP: Record<ModalActionWidth, string> = {
  auto: "",
  fill: "flex-1",
};
const TONE_VARIANT_MAP: Record<ModalActionTone, WaflButtonVariant> = {
  neutral: "secondary",
  primary: "primary",
  danger: "danger",
};
const LAYOUT_CLASS_MAP: Record<ModalFooterLayout, string> = {
  end: "flex items-center justify-end gap-2",
  split: "flex gap-2",
  "stack-reverse": "flex flex-col-reverse gap-2 md:flex-row md:justify-end",
};

export function getModalActionDisabledState(...conditions: boolean[]) {
  return conditions.some(Boolean);
}

export function createModalActionHandler({
  shouldProceed = true,
  beforeAction,
  action,
  onClose,
  closeAfterAction = false,
}: {
  shouldProceed?: boolean;
  beforeAction?: () => void;
  action: () => void;
  onClose?: () => void;
  closeAfterAction?: boolean;
}) {
  return () => {
    if (!shouldProceed) return;
    beforeAction?.();
    action();
    if (closeAfterAction) {
      onClose?.();
    }
  };
}

function ModalActionButton({ label, onClick, disabled, tone = "neutral", width = "auto", className }: ModalActionButtonConfig) {
  return (
    <WaflButton
      type="button"
      variant={TONE_VARIANT_MAP[tone]}
      size={width === "fill" ? "md" : "sm"}
      onClick={onClick}
      disabled={disabled}
      className={[WIDTH_CLASS_MAP[width], className].filter(Boolean).join(" ")}
    >
      {label}
    </WaflButton>
  );
}

export function renderModalFooterActions({
  primary,
  secondary,
  layout = "end",
}: {
  primary: ModalActionButtonConfig;
  secondary?: ModalActionButtonConfig;
  layout?: ModalFooterLayout;
}): ReactNode {
  return (
    <div className={LAYOUT_CLASS_MAP[layout]}>
      {secondary ? <ModalActionButton {...secondary} /> : null}
      <ModalActionButton {...primary} />
    </div>
  );
}
