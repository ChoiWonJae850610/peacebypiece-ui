"use client";

import { useEffect, useState } from "react";

export type PartnerWorkOrderOptions = {
  factoryOptions: string[];
  materialVendorOptions: {
    fabric: string[];
    subsidiary: string[];
  };
  outsourcingVendorOptions: string[];
  outsourcingVendorOptionsByProcess: Record<string, string[]>;
  outsourcingProcessOptions: string[];
  partnerItemOptions: {
    labor: string[];
    fabric: string[];
    subsidiary: string[];
    outsourcing: string[];
  };
};

const EMPTY_OPTIONS: PartnerWorkOrderOptions = {
  factoryOptions: [],
  materialVendorOptions: {
    fabric: [],
    subsidiary: [],
  },
  outsourcingVendorOptions: [],
  outsourcingVendorOptionsByProcess: {},
  outsourcingProcessOptions: [],
  partnerItemOptions: {
    labor: [],
    fabric: [],
    subsidiary: [],
    outsourcing: [],
  },
};

function normalizeOptionList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const options: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;
    const option = value.trim();
    if (!option || seen.has(option)) continue;
    seen.add(option);
    options.push(option);
  }

  return options;
}


function normalizeOptionsRecord(values: unknown): Record<string, string[]> {
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};

  return Object.fromEntries(
    Object.entries(values as Record<string, unknown>)
      .map(([key, value]) => [key.trim().toLocaleLowerCase("ko-KR"), normalizeOptionList(value)] as const)
      .filter(([key, options]) => Boolean(key) && options.length > 0),
  );
}

function normalizeWorkOrderOptions(response: Partial<PartnerWorkOrderOptions>): PartnerWorkOrderOptions {
  return {
    factoryOptions: normalizeOptionList(response.factoryOptions),
    materialVendorOptions: {
      fabric: normalizeOptionList(response.materialVendorOptions?.fabric),
      subsidiary: normalizeOptionList(response.materialVendorOptions?.subsidiary),
    },
    outsourcingVendorOptions: normalizeOptionList(response.outsourcingVendorOptions),
    outsourcingVendorOptionsByProcess: normalizeOptionsRecord(response.outsourcingVendorOptionsByProcess),
    outsourcingProcessOptions: normalizeOptionList(response.outsourcingProcessOptions),
    partnerItemOptions: {
      labor: normalizeOptionList(response.partnerItemOptions?.labor),
      fabric: normalizeOptionList(response.partnerItemOptions?.fabric),
      subsidiary: normalizeOptionList(response.partnerItemOptions?.subsidiary),
      outsourcing: normalizeOptionList(response.partnerItemOptions?.outsourcing),
    },
  };
}

export function usePartnerWorkOrderOptions() {
  const [options, setOptions] = useState<PartnerWorkOrderOptions>(EMPTY_OPTIONS);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/partners/workorder-options", { cache: "no-store" })
      .then((response) => response.json() as Promise<Partial<PartnerWorkOrderOptions>>)
      .then((data) => {
        if (cancelled) return;
        setOptions(normalizeWorkOrderOptions(data));
      })
      .catch(() => {
        if (cancelled) return;
        setOptions(EMPTY_OPTIONS);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}
