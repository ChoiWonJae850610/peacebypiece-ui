"use client";

import { useMemo, useState, useTransition } from "react";

import type { CompanyCatalogSummary } from "@/lib/catalog/systemCatalogRepository";

type Props = {
  initialCatalog: CompanyCatalogSummary;
};

export default function CompanyCatalogSettingsClient({ initialCatalog }: Props) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [error, setError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const categories = useMemo(() => catalog.categories, [catalog.categories]);

  function toggleCategory(categoryCode: string, nextEnabled: boolean) {
    setError(null);
    setPendingCode(categoryCode);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/catalog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryCode, isEnabled: nextEnabled }),
        });
        const payload = (await response.json()) as { ok?: boolean; catalog?: CompanyCatalogSummary; error?: string };
        if (!response.ok || !payload.ok || !payload.catalog) {
          throw new Error(payload.error ?? "COMPANY_CATALOG_PATCH_FAILED");
        }
        setCatalog(payload.catalog);
      } catch (patchError) {
        setError(patchError instanceof Error ? patchError.message : "COMPANY_CATALOG_PATCH_FAILED");
      } finally {
        setPendingCode(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Catalog version</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{catalog.catalogVersionCode ?? "not provisioned"}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Enabled categories</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{categories.filter((item) => item.isEnabled).length}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">POM templates</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{catalog.poms.length}</div>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">Company categories</div>
        <div className="divide-y divide-slate-100">
          {categories.map((category) => (
            <div key={category.code} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_120px_120px_110px]">
              <div>
                <div className="font-medium text-slate-900">{category.displayName}</div>
                <div className="text-xs text-slate-500">{category.code}</div>
              </div>
              <div className="text-slate-600">{category.domain}</div>
              <div className={category.isEnabled ? "text-emerald-700" : "text-slate-500"}>
                {category.isEnabled ? "enabled" : "disabled"}
              </div>
              <button
                type="button"
                disabled={isPending && pendingCode === category.code}
                onClick={() => toggleCategory(category.code, !category.isEnabled)}
                className="inline-flex h-9 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {category.isEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
