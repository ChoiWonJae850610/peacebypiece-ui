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

const WORKORDER_OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedOptions: PartnerWorkOrderOptions | null = null;
let cachedOptionsAt = 0;
let optionsLoadPromise: Promise<PartnerWorkOrderOptions> | null = null;

function cloneWorkOrderOptions(options: PartnerWorkOrderOptions): PartnerWorkOrderOptions {
  return {
    factoryOptions: [...options.factoryOptions],
    materialVendorOptions: {
      fabric: [...options.materialVendorOptions.fabric],
      subsidiary: [...options.materialVendorOptions.subsidiary],
    },
    outsourcingVendorOptions: [...options.outsourcingVendorOptions],
    outsourcingVendorOptionsByProcess: Object.fromEntries(
      Object.entries(options.outsourcingVendorOptionsByProcess).map(([key, values]) => [key, [...values]]),
    ),
    outsourcingProcessOptions: [...options.outsourcingProcessOptions],
    partnerItemOptions: {
      labor: [...options.partnerItemOptions.labor],
      fabric: [...options.partnerItemOptions.fabric],
      subsidiary: [...options.partnerItemOptions.subsidiary],
      outsourcing: [...options.partnerItemOptions.outsourcing],
    },
  };
}

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

function isOptionsCacheValid(now = Date.now()) {
  return Boolean(cachedOptions && now - cachedOptionsAt < WORKORDER_OPTIONS_CACHE_TTL_MS);
}

async function loadPartnerWorkOrderOptions(): Promise<PartnerWorkOrderOptions> {
  const now = Date.now();
  if (isOptionsCacheValid(now) && cachedOptions) {
    return cloneWorkOrderOptions(cachedOptions);
  }

  if (!optionsLoadPromise) {
    optionsLoadPromise = fetch("/api/partners/workorder-options", { cache: "no-store" })
      .then((response) => response.json() as Promise<Partial<PartnerWorkOrderOptions>>)
      .then((data) => {
        const normalizedOptions = normalizeWorkOrderOptions(data);
        cachedOptions = normalizedOptions;
        cachedOptionsAt = Date.now();
        return cloneWorkOrderOptions(normalizedOptions);
      })
      .finally(() => {
        optionsLoadPromise = null;
      });
  }

  return optionsLoadPromise.then(cloneWorkOrderOptions);
}

export function usePartnerWorkOrderOptions() {
  const [options, setOptions] = useState<PartnerWorkOrderOptions>(() =>
    cachedOptions ? cloneWorkOrderOptions(cachedOptions) : EMPTY_OPTIONS,
  );

  useEffect(() => {
    let cancelled = false;

    loadPartnerWorkOrderOptions()
      .then((data) => {
        if (cancelled) return;
        setOptions(data);
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
