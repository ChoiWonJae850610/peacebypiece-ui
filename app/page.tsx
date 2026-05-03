import WorkOrderWorkspace from "@/components/workorder/WorkOrderWorkspace";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { WorkorderRepositoryProvider } from "@/lib/repositories/WorkorderRepositoryProvider";

type HomePageProps = {
  searchParams?: Promise<{ workOrderId?: string | string[] }>;
};

function readWorkOrderId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const initialWorkOrderId = readWorkOrderId(resolvedSearchParams?.workOrderId);

  return (
    <I18nProvider initialLocale={DEFAULT_LOCALE}>
      <WorkorderRepositoryProvider>
        <WorkOrderWorkspace initialWorkOrderId={initialWorkOrderId} />
      </WorkorderRepositoryProvider>
    </I18nProvider>
  );
}
