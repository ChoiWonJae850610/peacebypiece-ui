import { SECTION_PREFERENCES_STORAGE_KEY } from "@/lib/constants/app";
import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";

export type PersistedSectionPreferences = {
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
};

const DEFAULT_SECTION_PREFERENCES: PersistedSectionPreferences = {
  basicInfoOpen: false,
  materialOpen: false,
  outsourcingOpen: false,
};

export function loadSectionPreferences(): PersistedSectionPreferences {
  const persisted = loadJsonFromStorage<Partial<PersistedSectionPreferences>>([SECTION_PREFERENCES_STORAGE_KEY]);

  return {
    basicInfoOpen: Boolean(persisted?.basicInfoOpen ?? DEFAULT_SECTION_PREFERENCES.basicInfoOpen),
    materialOpen: Boolean(persisted?.materialOpen ?? DEFAULT_SECTION_PREFERENCES.materialOpen),
    outsourcingOpen: Boolean(persisted?.outsourcingOpen ?? DEFAULT_SECTION_PREFERENCES.outsourcingOpen),
  };
}

export function persistSectionPreferences(payload: PersistedSectionPreferences) {
  persistJsonToStorage(SECTION_PREFERENCES_STORAGE_KEY, payload);
}
