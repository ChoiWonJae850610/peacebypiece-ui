import { adminEn } from "@/lib/i18n/en/admin";
import { commonEn } from "@/lib/i18n/en/common";
import { workorderEn } from "@/lib/i18n/en/workorder";
import { adminKo } from "@/lib/i18n/ko/admin";
import { commonKo } from "@/lib/i18n/ko/common";
import { workorderKo } from "@/lib/i18n/ko/workorder";

export const I18N_RESOURCES = {
  ko: { common: commonKo, workorder: workorderKo, admin: adminKo },
  en: { common: commonEn, workorder: workorderEn, admin: adminEn },
} as const;

export type Locale = keyof typeof I18N_RESOURCES;
export const DEFAULT_LOCALE: Locale = "ko";

export function getI18n(locale: Locale = DEFAULT_LOCALE) {
  return I18N_RESOURCES[locale];
}

export { I18nProvider } from "@/lib/i18n/I18nProvider";
export { useI18n } from "@/lib/i18n/useI18n";
