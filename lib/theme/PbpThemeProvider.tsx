"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PERSONAL_SETTINGS_CHANGE_EVENT,
  PERSONAL_SETTINGS_STORAGE_KEY,
  readStoredPersonalSettings,
} from "@/lib/me/personalSettings";
import { applyPbpThemeToDocumentElement } from "./themeDocument";
import { DEFAULT_PBP_THEME_ID, getPbpThemeDefinition } from "./themeRegistry";
import type { PbpThemeDefinition, PbpThemeId } from "./themeTypes";

type PbpThemeContextValue = {
  themeId: PbpThemeId;
  theme: PbpThemeDefinition;
  setThemeId: (themeId: PbpThemeId) => void;
};

const PbpThemeContext = createContext<PbpThemeContextValue | null>(null);

type PbpThemeProviderProps = {
  children: ReactNode;
  initialThemeId?: PbpThemeId;
};

type PersonalSettingsChangeEvent = CustomEvent<{
  settings?: {
    theme?: unknown;
  };
}>;

function resolveStoredThemeId(storage: Storage | null | undefined, fallbackThemeId: PbpThemeId): PbpThemeId {
  return readStoredPersonalSettings(storage).theme ?? fallbackThemeId;
}

function resolveInitialClientThemeId(fallbackThemeId: PbpThemeId): PbpThemeId {
  if (typeof window === "undefined") return fallbackThemeId;
  return resolveStoredThemeId(window.localStorage, fallbackThemeId);
}

export function PbpThemeProvider({
  children,
  initialThemeId = DEFAULT_PBP_THEME_ID,
}: PbpThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<PbpThemeId>(() => resolveInitialClientThemeId(initialThemeId));
  const theme = useMemo(() => getPbpThemeDefinition(themeId), [themeId]);
  const setThemeId = useCallback((nextThemeId: PbpThemeId) => {
    setThemeIdState(getPbpThemeDefinition(nextThemeId).id);
  }, []);

  useEffect(() => {
    setThemeIdState(resolveStoredThemeId(window.localStorage, initialThemeId));

    const handlePersonalSettingsChange = (event: Event) => {
      const nextThemeId = (event as PersonalSettingsChangeEvent).detail?.settings?.theme;
      setThemeIdState(getPbpThemeDefinition(nextThemeId as PbpThemeId | undefined).id);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PERSONAL_SETTINGS_STORAGE_KEY) return;
      setThemeIdState(resolveStoredThemeId(window.localStorage, initialThemeId));
    };

    window.addEventListener(PERSONAL_SETTINGS_CHANGE_EVENT, handlePersonalSettingsChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PERSONAL_SETTINGS_CHANGE_EVENT, handlePersonalSettingsChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialThemeId]);

  useEffect(() => {
    applyPbpThemeToDocumentElement(document.documentElement, theme);
  }, [theme]);

  const value = useMemo<PbpThemeContextValue>(
    () => ({
      themeId: theme.id,
      theme,
      setThemeId,
    }),
    [setThemeId, theme],
  );

  return <PbpThemeContext.Provider value={value}>{children}</PbpThemeContext.Provider>;
}

export function usePbpTheme() {
  const value = useContext(PbpThemeContext);

  if (!value) {
    throw new Error("usePbpTheme must be used inside PbpThemeProvider.");
  }

  return value;
}
