import { getI18n } from "@/lib/i18n";

const i18n = getI18n();

export const UI_TEXT = i18n.common.ui;

export const DETAIL_TOGGLE_TEXT = {
  closed: UI_TEXT.common.detail,
  open: UI_TEXT.common.collapse,
} as const;
