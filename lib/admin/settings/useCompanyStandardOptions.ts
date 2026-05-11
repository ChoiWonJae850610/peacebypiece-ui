"use client";

import { useEffect, useMemo, useState } from "react";
import { MATERIAL_UNIT_OPTIONS } from "@/lib/constants/material";
import { OUTSOURCING_UNIT_OPTIONS } from "@/lib/constants/workorderOptions";
import type { AdminStandardsPayload } from "@/lib/admin/settings/standardsTypes";

function normalizeUniqueOptions(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const next = value.trim();
    if (!next || seen.has(next)) return;
    seen.add(next);
    result.push(next);
  });

  return result;
}

function buildPriceBasisLabel(unitLabel: string): string {
  const normalized = unitLabel.trim();
  if (!normalized) return normalized;
  if (normalized.endsWith("당")) return normalized;
  return `${normalized}당`;
}

export function useCompanyStandardOptions() {
  const fallbackMaterialUnitOptions = useMemo(() => Array.from(MATERIAL_UNIT_OPTIONS), []);
  const fallbackPriceBasisOptions = useMemo(() => Array.from(OUTSOURCING_UNIT_OPTIONS), []);
  const [materialUnitOptions, setMaterialUnitOptions] = useState<string[]>(fallbackMaterialUnitOptions);
  const [priceBasisOptions, setPriceBasisOptions] = useState<string[]>(fallbackPriceBasisOptions);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/standards", { method: "GET", cache: "no-store" })
      .then(async (response) => (await response.json()) as AdminStandardsPayload)
      .then((payload) => {
        if (!isMounted) return;
        const activeUnitLabels = normalizeUniqueOptions(
          (Array.isArray(payload.units) ? payload.units : [])
            .filter((unit) => unit.is_active !== false)
            .map((unit) => unit.name || unit.code),
        );

        if (activeUnitLabels.length === 0) {
          if (payload.repository?.mode === "fallback" || payload.error) {
            setMaterialUnitOptions(fallbackMaterialUnitOptions);
            setPriceBasisOptions(fallbackPriceBasisOptions);
            return;
          }
          setMaterialUnitOptions([]);
          setPriceBasisOptions([]);
          return;
        }

        setMaterialUnitOptions(activeUnitLabels);
        setPriceBasisOptions(normalizeUniqueOptions(activeUnitLabels.map(buildPriceBasisLabel)));
      })
      .catch(() => {
        if (!isMounted) return;
        setMaterialUnitOptions(fallbackMaterialUnitOptions);
        setPriceBasisOptions(fallbackPriceBasisOptions);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackMaterialUnitOptions, fallbackPriceBasisOptions]);

  return { materialUnitOptions, priceBasisOptions };
}
