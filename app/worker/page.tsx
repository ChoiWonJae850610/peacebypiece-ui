import WorkOrderWorkspace from "@/components/workorder/WorkOrderWorkspace";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { WorkorderRepositoryProvider } from "@/lib/repositories/WorkorderRepositoryProvider";

export default function WorkerPage() {
  return (
    <I18nProvider initialLocale={DEFAULT_LOCALE}>
      <WorkorderRepositoryProvider>
        <WorkOrderWorkspace />
      </WorkorderRepositoryProvider>
    </I18nProvider>
  );
}
