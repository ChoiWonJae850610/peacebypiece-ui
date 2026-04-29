import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner";

export const OUTSOURCING_PROCESS_STORAGE_KEY = "peacebypiece-outsourcing-processes";

export function loadPersistedOutsourcingProcesses(): OutsourcingProcessDefinition[] | null {
  return loadJsonFromStorage<OutsourcingProcessDefinition[]>([OUTSOURCING_PROCESS_STORAGE_KEY]);
}

export function persistOutsourcingProcesses(definitions: OutsourcingProcessDefinition[]) {
  persistJsonToStorage(OUTSOURCING_PROCESS_STORAGE_KEY, definitions);
}
