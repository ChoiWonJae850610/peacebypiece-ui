import SystemShell from "@/components/system/layout/SystemShell";
import { listSystemCatalog } from "@/lib/catalog/systemCatalogRepository";

export default async function SystemCatalogPage() {
  const catalog = await listSystemCatalog();
  const activeDefaults = catalog.categories.filter((item) => item.defaultEnabled).length;
  const optionalDefaults = catalog.categories.filter((item) => item.isOptional).length;

  return (
    <SystemShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-slate-950">System Catalog</h1>
          <p className="mt-1 text-sm text-slate-600">Versioned category, size, and POM defaults for new company provisioning.</p>
        </section>
        <section className="grid gap-3 sm:grid-cols-4">
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Version</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{catalog.catalogVersionCode}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Categories</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{catalog.categories.length}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Active defaults</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{activeDefaults}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Optional defaults</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{optionalDefaults}</div>
          </div>
        </section>

        <section className="rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">Category defaults</div>
          <div className="divide-y divide-slate-100">
            {catalog.categories.map((category) => (
              <div key={category.code} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_130px_130px_90px]">
                <div>
                  <div className="font-medium text-slate-900">{category.displayName}</div>
                  <div className="text-xs text-slate-500">{category.code}</div>
                </div>
                <div className="text-slate-600">{category.domain}</div>
                <div className="text-slate-600">depth {category.depth}</div>
                <div className={category.defaultEnabled ? "text-emerald-700" : "text-slate-500"}>
                  {category.defaultEnabled ? "active" : "inactive"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SystemShell>
  );
}
