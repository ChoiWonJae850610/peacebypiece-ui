import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  MATERIAL_MOCK_ITEMS,
  MATERIAL_SUMMARY_ITEMS,
} from "@/features/materials/__fixtures__/materialsMock";
import {
  MATERIAL_KIND_DESCRIPTIONS,
  MATERIAL_KIND_LABELS,
} from "@/lib/materials/constants";
import type { MaterialKind, MaterialMockItem } from "@/lib/materials/types";

function MaterialSummaryCards() {
  return (
    <section className="grid gap-3 md:grid-cols-3" aria-label="원단·부자재 요약">
      {MATERIAL_SUMMARY_ITEMS.map((item) => (
        <AdminCard key={item.label} className="min-h-[132px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight pbp-text-primary">{item.value}</p>
            </div>
            <AdminStatusBadge tone="brand">목업</AdminStatusBadge>
          </div>
          <p className="mt-4 text-xs leading-5 pbp-text-muted">{item.description}</p>
        </AdminCard>
      ))}
    </section>
  );
}

function MaterialList({ kind, items }: { kind: MaterialKind; items: MaterialMockItem[] }) {
  return (
    <AdminCard className="flex min-h-[420px] flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight pbp-text-primary">{MATERIAL_KIND_LABELS[kind]}</h2>
            <AdminStatusBadge tone="neutral">fixture</AdminStatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 pbp-text-muted">{MATERIAL_KIND_DESCRIPTIONS[kind]}</p>
        </div>
        <AdminButton disabled title="DB 연결 이후 활성화됩니다.">
          등록 예정
        </AdminButton>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)]">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-[var(--pbp-border)] px-4 py-3 text-xs font-semibold pbp-text-subtle max-md:hidden">
          <span>품명</span>
          <span>분류</span>
          <span>거래처</span>
          <span>단위/상태</span>
        </div>
        <div className="divide-y divide-[var(--pbp-border)]">
          {items.map((item) => (
            <article key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold pbp-text-primary">{item.name}</h3>
                  <span className="rounded-full border border-[var(--pbp-border)] px-2 py-0.5 text-[11px] font-semibold pbp-text-muted">{item.code}</span>
                </div>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">{item.memo}</p>
              </div>
              <div className="text-sm pbp-text-primary">
                <span className="md:hidden pbp-text-subtle">분류: </span>
                {item.category}
              </div>
              <div className="text-sm pbp-text-muted">
                <span className="md:hidden pbp-text-subtle">거래처: </span>
                {item.supplierName}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminStatusBadge tone="info">{item.unit}</AdminStatusBadge>
                <AdminStatusBadge tone="neutral">{item.stockLabel}</AdminStatusBadge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AdminCard>
  );
}

export default function MaterialsWorkspacePage() {
  const fabricItems = MATERIAL_MOCK_ITEMS.filter((item) => item.kind === "fabric");
  const submaterialItems = MATERIAL_MOCK_ITEMS.filter((item) => item.kind === "submaterial");

  return (
    <div className="flex min-h-full flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-[var(--pbp-shadow-card)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge tone="brand">0.16.16</AdminStatusBadge>
              <AdminStatusBadge tone="warning">DB 미연결</AdminStatusBadge>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight pbp-text-primary">원단·부자재 기준 화면 목업</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 pbp-text-muted">
              이 화면은 원단·부자재의 정보 구조, 목록 밀도, 작업지시서 연결 전 필드 구성을 확인하기 위한 목업입니다.
              임시 데이터는 features/materials/__fixtures__에만 두며, 실제 DB 저장과 발주 상태 변경은 아직 연결하지 않습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton disabled title="0.16.18 DB 연결 이후 활성화됩니다.">원단 등록</AdminButton>
            <AdminButton disabled title="0.16.18 DB 연결 이후 활성화됩니다.">부자재 등록</AdminButton>
          </div>
        </div>
      </section>

      <MaterialSummaryCards />

      <section className="grid gap-4 xl:grid-cols-2" aria-label="원단·부자재 목록 목업">
        <MaterialList kind="fabric" items={fabricItems} />
        <MaterialList kind="submaterial" items={submaterialItems} />
      </section>
    </div>
  );
}
