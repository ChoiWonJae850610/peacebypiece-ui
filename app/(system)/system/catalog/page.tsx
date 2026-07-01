import SystemShell from "@/components/system/layout/SystemShell";
import { listSystemCatalog } from "@/lib/catalog/systemCatalogRepository";

export default async function SystemCatalogPage() {
  const catalog = await listSystemCatalog();
  const activeDefaults = catalog.categories.filter((item) => item.defaultEnabled).length;
  const optionalDefaults = catalog.categories.filter((item) => item.isOptional).length;

  return (
    <SystemShell>
      <div className="min-w-0 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-slate-950">시스템 카탈로그</h1>
          <p className="mt-1 text-sm text-slate-600">신규 회사 provisioning에 적용되는 분류, 사이즈, POM 기본값입니다.</p>
        </section>
        <section className="grid gap-3 sm:grid-cols-4">
          <div className="min-w-0 rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">버전</div>
            <div className="mt-1 break-words text-sm font-semibold text-slate-900">{catalog.catalogVersionCode}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">분류</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{catalog.categories.length}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">기본 활성</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{activeDefaults}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">선택 분류</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{optionalDefaults}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">분류 기본값</div>
          <div className="divide-y divide-slate-100">
            {catalog.categories.map((category) => (
              <div key={category.code} className="grid min-w-0 gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_130px_130px_90px]">
                <div className="min-w-0">
                  <div className="break-words font-medium text-slate-900">{category.displayName}</div>
                  <div className="break-all text-xs text-slate-500">{category.code}</div>
                </div>
                <div className="break-words text-slate-600">{category.domain}</div>
                <div className="text-slate-600">depth {category.depth}</div>
                <div className={category.defaultEnabled ? "text-emerald-700" : "text-slate-500"}>
                  {category.defaultEnabled ? "활성" : "비활성"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SystemShell>
  );
}
