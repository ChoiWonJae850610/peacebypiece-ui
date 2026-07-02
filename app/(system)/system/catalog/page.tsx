import SystemShell from "@/components/system/layout/SystemShell";
import { listSystemCatalog } from "@/lib/catalog/systemCatalogRepository";

export default async function SystemCatalogPage() {
  const catalog = await listSystemCatalog();
  const activeDefaults = catalog.categories.filter((item) => item.defaultEnabled).length;
  const optionalDefaults = catalog.categories.filter((item) => item.isOptional).length;
  const topLevelCategories = catalog.categories.filter((item) => item.depth === 1);

  return (
    <SystemShell>
      <div className="min-w-0 space-y-6">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">기준관리</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">생산품 분류·사이즈·치수</h1>
          <p className="mt-1 text-sm text-slate-600">
            신규 회사에 제공되는 생산품 분류, 사이즈 체계, 측정 항목, 기본 치수표를 한곳에서 확인합니다.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          <div className="min-w-0 rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">기준 버전</div>
            <div className="mt-1 break-words text-sm font-semibold text-slate-900">{catalog.catalogVersionCode}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">생산품 분류</div>
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

        <section className="grid gap-3 lg:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-950">생산품 분류</h2>
            <p className="mt-1 text-xs text-slate-600">상위 분류와 기본 활성 여부를 확인합니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topLevelCategories.map((category) => (
                <span key={category.code} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {category.displayName}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-950">사이즈 체계</h2>
            <p className="mt-1 text-xs text-slate-600">XS~XL, 44/55/66/77 등 회사 업무에 연결되는 기본 사이즈 묶음입니다.</p>
            <div className="mt-3 text-2xl font-semibold text-slate-900">{catalog.sizeSets.length}</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-950">측정 항목·기본 치수표</h2>
            <p className="mt-1 text-xs text-slate-600">작업지시서 치수 입력과 PDF에 연결되는 측정 항목입니다.</p>
            <div className="mt-3 text-2xl font-semibold text-slate-900">{catalog.poms.length}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">분류 기본값</div>
          <div className="divide-y divide-slate-100">
            {catalog.categories.map((category) => (
              <div key={category.code} className="grid min-w-0 gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_130px_130px_90px]">
                <div className="min-w-0">
                  <div className="break-words font-medium text-slate-900">{category.displayName}</div>
                  <div className="break-all text-xs text-slate-500">{category.depth}단계</div>
                </div>
                <div className="break-words text-slate-600">{category.domain}</div>
                <div className="text-slate-600">{category.isOptional ? "선택 활성" : "기본 제공"}</div>
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
