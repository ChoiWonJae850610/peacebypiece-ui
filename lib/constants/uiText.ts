import { getI18n } from "@/lib/i18n";

export function getDetailToggleText(open: boolean) {
  const common = getI18n().common.ui.common;
  return open ? common.collapse : common.detail;
}
