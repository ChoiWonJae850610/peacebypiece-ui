"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";

type TranslateParams = Record<string, string | number>;

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function interpolate(value: string, params?: TranslateParams) {
  if (!params) return value;
  return Object.entries(params).reduce((result, [key, nextValue]) => result.replaceAll(`{${key}}`, String(nextValue)), value);
}

export function useAdminTranslation() {
  const { i18n } = useI18n();
  return useCallback((path: string, fallback = path, params?: TranslateParams) => {
    const value = readPath(i18n.admin, path);
    if (typeof value !== "string") return interpolate(fallback, params);
    return interpolate(value, params);
  }, [i18n.admin]);
}
