import PersonalSettingsPage from "@/components/me/PersonalSettingsPage";
import { DEFAULT_LOCALE, I18nProvider } from "@/lib/i18n";

export default function MeSettingsPage() {
  return (
    <I18nProvider initialLocale={DEFAULT_LOCALE}>
      <PersonalSettingsPage />
    </I18nProvider>
  );
}
