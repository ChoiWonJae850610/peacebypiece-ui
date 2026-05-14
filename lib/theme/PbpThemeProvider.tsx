"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

export function PbpThemeProvider({
  children,
  initialThemeId = DEFAULT_PBP_THEME_ID,
}: PbpThemeProviderProps) {
  const [themeId, setThemeId] = useState<PbpThemeId>(initialThemeId);
  const theme = useMemo(() => getPbpThemeDefinition(themeId), [themeId]);

  useEffect(() => {
    applyPbpThemeToDocumentElement(document.documentElement, theme);
  }, [theme]);

  const value = useMemo<PbpThemeContextValue>(
    () => ({
      themeId: theme.id,
      theme,
      setThemeId,
    }),
    [theme],
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
