import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import { UI_TEXT } from "@/lib/constants/uiText";

export const MODAL_ACTION_LABELS = {
  cancel: UI_TEXT.common.cancel,
  close: UI_TEXT.common.close,
  apply: UI_TEXT.common.apply,
  create: UI_TEXT.common.create,
  delete: UI_TEXT.common.delete,
  completeInspection: "검수 완료",
  proceedOrderRequest: "발주 요청 진행",
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

const BASE_BUTTON_CLASS = "pbp-interactive-button rounded-xl px-4 text-sm";
const WIDTH_CLASS_MAP: Record<ModalActionWidth, string> = {
  auto: "py-2 font-medium",
  fill: "flex-1 py-3 font-medium",
};
const TONE_CLASS_MAP: Record<ModalActionTone, string> = {
  neutral: "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100",
  primary: "bg-stone-900 text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:bg-stone-300",
  danger: "bg-rose-600 font-semibold text-white hover:bg-rose-700 active:bg-rose-800 disabled:cursor-not-allowed disabled:bg-rose-300",
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(BASE_BUTTON_CLASS, WIDTH_CLASS_MAP[width], TONE_CLASS_MAP[tone], className)}
    >
      {label}
    </button>
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
