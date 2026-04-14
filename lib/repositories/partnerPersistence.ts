import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";
import type { Partner } from "@/types/partner";

export const PARTNER_MASTER_STORAGE_KEY = "peacebypiece-partner-master";

export function loadPersistedPartners(): Partner[] | null {
  return loadJsonFromStorage<Partner[]>([PARTNER_MASTER_STORAGE_KEY]);
}

export function persistPartners(partners: Partner[]) {
  persistJsonToStorage(PARTNER_MASTER_STORAGE_KEY, partners);
}
