"use client";

import { useEffect, useState } from "react";
import type { AdminStandardsPayload } from "@/lib/admin/settings/standardsTypes";
import { waflLegacyApiRequest } from "@/lib/api/waflApiClient";

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
  const [materialUnitOptions, setMaterialUnitOptions] = useState<string[]>([]);
  const [priceBasisOptions, setPriceBasisOptions] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      try {
        const payload = await waflLegacyApiRequest<AdminStandardsPayload>(
          "/api/admin/standards",
          { method: "GET", cache: "no-store" },
          "회사 기준정보를 불러오지 못했습니다.",
        );
        if (!isMounted) return;
        const activeUnitLabels = normalizeUniqueOptions(
          (Array.isArray(payload.units) ? payload.units : [])
            .filter((unit) => unit.is_active !== false)
            .map((unit) => unit.name || unit.code),
        );
        setMaterialUnitOptions(activeUnitLabels);
        setPriceBasisOptions(normalizeUniqueOptions(activeUnitLabels.map(buildPriceBasisLabel)));
      } catch {
        if (!isMounted) return;
        setMaterialUnitOptions([]);
        setPriceBasisOptions([]);
      }
    };
    void loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  return { materialUnitOptions, priceBasisOptions };
}
