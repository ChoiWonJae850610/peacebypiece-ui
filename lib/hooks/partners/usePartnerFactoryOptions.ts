"use client";

import { useEffect, useState } from "react";

type PartnerFactoryOptionResponse = {
  partners?: Array<{
    id: string;
    name: string;
    type: string;
    is_active: boolean;
  }>;
};

function normalizeFactoryOptions(response: PartnerFactoryOptionResponse): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  for (const partner of response.partners ?? []) {
    const name = partner.name.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    options.push(name);
  }

  return options;
}

export function usePartnerFactoryOptions() {
  const [factoryOptions, setFactoryOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/partners/factories", { cache: "no-store" })
      .then((response) => response.json() as Promise<PartnerFactoryOptionResponse>)
      .then((data) => {
        if (cancelled) return;
        setFactoryOptions(normalizeFactoryOptions(data));
      })
      .catch(() => {
        if (cancelled) return;
        setFactoryOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return factoryOptions;
}
