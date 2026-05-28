"use client";

import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import AppSelect from "@/components/common/ui/AppSelect";
import {
  MATERIAL_KIND_DESCRIPTIONS,
  MATERIAL_KIND_LABELS,
  MATERIAL_LIFECYCLE_STATUS_LABELS,
  MATERIAL_UNIT_LABELS,
} from "@/lib/materials/constants";
import type { Material, MaterialCapabilityState, MaterialKind, MaterialLifecycleStatus, MaterialUnit } from "@/lib/materials/types";

type MaterialsApiResponse = {
  materials?: Material[];
  capabilities?: Partial<MaterialCapabilityState>;
  error?: string;
};

type MaterialDraft = {
  kind: MaterialKind;
  code: string;
  name: string;
  unit: MaterialUnit;
  lifecycleStatus: MaterialLifecycleStatus;
  memo: string;
};

type MaterialsWorkspacePageProps = {
  initialMaterials: Material[];
  initialCapabilities?: Partial<MaterialCapabilityState> | null;
  initialError?: string | null;
};

const EMPTY_DRAFT: MaterialDraft = {
  kind: "fabric",
  code: "",
  name: "",
  unit: "yd",
  lifecycleStatus: "active",
  memo: "",
};

function materialKindTone(kind: MaterialKind): "info" | "brand" {
  return kind === "fabric" ? "info" : "brand";
}

function getMaterialDescription(material: Material): string {
  if (material.kind === "fabric") {
    const parts = [material.attributes.composition, material.attributes.colorName].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : material.memo ?? "원단 속성은 다음 단계에서 상세 입력으로 확장합니다.";
  }

  const parts = [material.attributes.specification, material.attributes.colorName, material.attributes.sizeLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : material.memo ?? "부자재 속성은 다음 단계에서 상세 입력으로 확장합니다.";
}

async function requestMaterialsApi(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>): Promise<MaterialsApiResponse> {
  const response = await fetch("/api/materials", {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as MaterialsApiResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "MATERIALS_API_ERROR");
  }

  return {
    materials: Array.isArray(payload.materials) ? payload.materials : [],
    capabilities: payload.capabilities,
  };
}

function MaterialSummaryCards({ materials }: { materials: Material[] }) {
  const activeCount = materials.filter((item) => item.lifecycleStatus === "active").length;
  const fabricCount = materials.filter((item) => item.kind === "fabric").length;
  const submaterialCount = materials.filter((item) => item.kind === "submaterial").length;
  const archivedCount = materials.filter((item) => item.lifecycleStatus === "archived").length;
  const summaryItems = [
    {
      label: "전체 기준 항목",
      value: `${materials.length}개`,
      description: `사용중 ${activeCount}개, 보관 ${archivedCount}개 기준입니다.`,
    },
    {
      label: "원단",
      value: `${fabricCount}개`,
      description: "원단 폭, 혼용률, 컬러 등 상세 속성은 다음 연결 단계에서 확장합니다.",
    },
    {
      label: "부자재",
      value: `${submaterialCount}개`,
      description: "단추, 지퍼, 라벨, 포장재 등 작업지시서 구성 항목 기준입니다.",
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3" aria-label="원단·부자재 요약">
      {summaryItems.map((item) => (
        <AdminCard key={item.label} className="min-h-[132px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight pbp-text-primary">{item.value}</p>
            </div>
            <AdminStatusBadge tone="success">DB</AdminStatusBadge>
          </div>
          <p className="mt-4 text-xs leading-5 pbp-text-muted">{item.description}</p>
        </AdminCard>
      ))}
    </section>
  );
}

function MaterialEditor({
  draft,
  editingId,
  isSaving,
  canManageMaterials,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: MaterialDraft;
  editingId: string | null;
  isSaving: boolean;
  canManageMaterials: boolean;
  onChange: (draft: MaterialDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const inputClassName = "min-h-10 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] px-3 py-2 text-sm pbp-text-primary outline-none focus:border-[var(--pbp-accent)]";

  return (
    <AdminCard className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight pbp-text-primary">{editingId ? "원단·부자재 수정" : "원단·부자재 등록"}</h2>
          <p className="mt-1 text-sm leading-6 pbp-text-muted">기본 CRUD 연결 확인용 입력 영역입니다. 상세 속성은 다음 단계에서 확장합니다.</p>
        </div>
        {editingId ? <AdminStatusBadge tone="warning">수정중</AdminStatusBadge> : <AdminStatusBadge tone="success">DB 연결</AdminStatusBadge>}
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr_1.2fr_0.8fr_0.8fr]">
        <label className="flex flex-col gap-1 text-xs font-semibold pbp-text-subtle">
          구분
          <AppSelect
            value={draft.kind}
            onValueChange={(value) => onChange({ ...draft, kind: value as MaterialKind })}
            options={[
              { value: "fabric", label: "원단" },
              { value: "submaterial", label: "부자재" },
            ]}
            disabled={!canManageMaterials || isSaving}
            size="sm"
            ariaLabel="구분"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold pbp-text-subtle">
          코드
          <input className={inputClassName} value={draft.code} onChange={(event) => onChange({ ...draft, code: event.target.value })} placeholder="FAB-001" disabled={!canManageMaterials || isSaving} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold pbp-text-subtle">
          품명
          <input className={inputClassName} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="코튼 트윌 / 단추" disabled={!canManageMaterials || isSaving} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold pbp-text-subtle">
          단위
          <AppSelect
            value={draft.unit}
            onValueChange={(value) => onChange({ ...draft, unit: value as MaterialUnit })}
            options={Object.entries(MATERIAL_UNIT_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={!canManageMaterials || isSaving}
            size="sm"
            ariaLabel="단위"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold pbp-text-subtle">
          상태
          <AppSelect
            value={draft.lifecycleStatus}
            onValueChange={(value) => onChange({ ...draft, lifecycleStatus: value as MaterialLifecycleStatus })}
            options={Object.entries(MATERIAL_LIFECYCLE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={!canManageMaterials || isSaving}
            size="sm"
            ariaLabel="상태"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold pbp-text-subtle">
        메모
        <textarea className={`${inputClassName} min-h-20 resize-y`} value={draft.memo} onChange={(event) => onChange({ ...draft, memo: event.target.value })} placeholder="간단한 원단/부자재 메모" disabled={!canManageMaterials || isSaving} />
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        {editingId ? <AdminButton onClick={onCancel}>취소</AdminButton> : null}
        <AdminButton variant="primary" onClick={onSubmit} disabled={!canManageMaterials || isSaving || !draft.code.trim() || !draft.name.trim()}>
          {isSaving ? "저장중" : editingId ? "수정 저장" : "등록"}
        </AdminButton>
      </div>
    </AdminCard>
  );
}

function MaterialList({
  kind,
  items,
  isSaving,
  canManageMaterials,
  onEdit,
  onDelete,
}: {
  kind: MaterialKind;
  items: Material[];
  isSaving: boolean;
  canManageMaterials: boolean;
  onEdit: (item: Material) => void;
  onDelete: (item: Material) => void;
}) {
  return (
    <AdminCard className="flex min-h-[420px] flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight pbp-text-primary">{MATERIAL_KIND_LABELS[kind]}</h2>
            <AdminStatusBadge tone={materialKindTone(kind)}>{items.length}개</AdminStatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 pbp-text-muted">{MATERIAL_KIND_DESCRIPTIONS[kind]}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)]">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-[var(--pbp-border)] px-4 py-3 text-xs font-semibold pbp-text-subtle max-md:hidden">
          <span>품명</span>
          <span>단위</span>
          <span>상태</span>
          <span className="text-right">작업</span>
        </div>
        <div className="divide-y divide-[var(--pbp-border)]">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm pbp-text-muted">등록된 {MATERIAL_KIND_LABELS[kind]} 항목이 없습니다.</div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold pbp-text-primary">{item.name}</h3>
                    <span className="rounded-full border border-[var(--pbp-border)] px-2 py-0.5 text-[11px] font-semibold pbp-text-muted">{item.code}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 pbp-text-muted">{getMaterialDescription(item)}</p>
                </div>
                <div className="text-sm pbp-text-primary">
                  <span className="md:hidden pbp-text-subtle">단위: </span>
                  {MATERIAL_UNIT_LABELS[item.unit]}
                </div>
                <div>
                  <AdminStatusBadge tone={item.lifecycleStatus === "active" ? "success" : "neutral"}>{MATERIAL_LIFECYCLE_STATUS_LABELS[item.lifecycleStatus]}</AdminStatusBadge>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <AdminButton size="sm" onClick={() => onEdit(item)} disabled={!canManageMaterials || isSaving}>수정</AdminButton>
                  <AdminButton size="sm" variant="danger" onClick={() => onDelete(item)} disabled={!canManageMaterials || isSaving}>삭제</AdminButton>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </AdminCard>
  );
}

const DEFAULT_MATERIAL_CAPABILITIES: MaterialCapabilityState = {
  canManageMaterials: false,
  canManageWorkorderMaterialLines: false,
  canChangeWorkorderMaterialOrderStatus: false,
};

function normalizeMaterialCapabilities(input?: Partial<MaterialCapabilityState> | null): MaterialCapabilityState {
  return {
    ...DEFAULT_MATERIAL_CAPABILITIES,
    ...(input ?? {}),
  };
}

export default function MaterialsWorkspacePage({ initialMaterials, initialCapabilities = null, initialError = null }: MaterialsWorkspacePageProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [draft, setDraft] = useState<MaterialDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError);
  const [capabilities, setCapabilities] = useState<MaterialCapabilityState>(() => normalizeMaterialCapabilities(initialCapabilities));

  const fabricItems = useMemo(() => materials.filter((item) => item.kind === "fabric"), [materials]);
  const submaterialItems = useMemo(() => materials.filter((item) => item.kind === "submaterial"), [materials]);

  const handleRefresh = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = await requestMaterialsApi("GET");
      setMaterials(payload.materials ?? []);
      setCapabilities(normalizeMaterialCapabilities(payload.capabilities));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "MATERIALS_REFRESH_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!capabilities.canManageMaterials) {
      setMessage("원단·부자재 기준정보를 수정할 권한이 없습니다.");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = await requestMaterialsApi(editingId ? "PATCH" : "POST", {
        materialId: editingId,
        ...draft,
      });
      setMaterials(payload.materials ?? []);
      setCapabilities(normalizeMaterialCapabilities(payload.capabilities));
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      setMessage(editingId ? "원단·부자재 항목을 수정했습니다." : "원단·부자재 항목을 등록했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "MATERIALS_SAVE_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: Material) => {
    if (!capabilities.canManageMaterials) {
      setMessage("원단·부자재 기준정보를 수정할 권한이 없습니다.");
      return;
    }
    setEditingId(item.id);
    setDraft({
      kind: item.kind,
      code: item.code,
      name: item.name,
      unit: item.unit,
      lifecycleStatus: item.lifecycleStatus,
      memo: item.memo ?? "",
    });
    setMessage(null);
  };

  const handleDelete = async (item: Material) => {
    if (!capabilities.canManageMaterials) {
      setMessage("원단·부자재 기준정보를 삭제할 권한이 없습니다.");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = await requestMaterialsApi("DELETE", { materialId: item.id });
      setMaterials(payload.materials ?? []);
      setCapabilities(normalizeMaterialCapabilities(payload.capabilities));
      if (editingId === item.id) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }
      setMessage("원단·부자재 항목을 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "MATERIALS_DELETE_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-[var(--pbp-shadow-card)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge tone="brand">0.16.22</AdminStatusBadge>
              <AdminStatusBadge tone="success">DB/API 1차 연결</AdminStatusBadge>
              <AdminStatusBadge tone={capabilities.canManageMaterials ? "success" : "neutral"}>{capabilities.canManageMaterials ? "관리 가능" : "조회 전용"}</AdminStatusBadge>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight pbp-text-primary">원단·부자재 기준정보</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 pbp-text-muted">
              원단·부자재 기준 항목을 회사 범위로 조회하고 기본 등록, 수정, 삭제를 확인합니다.
              작업지시서 연결과 발주 상태 연결은 다음 단계에서 분리해 진행합니다.
            </p>
          </div>
          <AdminButton onClick={handleRefresh} disabled={isSaving}>새로고침</AdminButton>
        </div>
        {message ? <p className="mt-4 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm pbp-text-muted">{message}</p> : null}
      </section>

      <MaterialSummaryCards materials={materials} />
      {!capabilities.canManageMaterials ? (
        <AdminCard className="border-dashed">
          <p className="text-sm font-semibold pbp-text-primary">조회 전용 권한입니다.</p>
          <p className="mt-1 text-sm leading-6 pbp-text-muted">원단·부자재 등록, 수정, 삭제는 기준정보 관리 권한이 있는 사용자만 실행할 수 있습니다.</p>
        </AdminCard>
      ) : null}
      <MaterialEditor draft={draft} editingId={editingId} isSaving={isSaving} canManageMaterials={capabilities.canManageMaterials} onChange={setDraft} onCancel={() => { setEditingId(null); setDraft(EMPTY_DRAFT); }} onSubmit={handleSubmit} />

      <section className="grid gap-4 xl:grid-cols-2" aria-label="원단·부자재 목록">
        <MaterialList kind="fabric" items={fabricItems} isSaving={isSaving} canManageMaterials={capabilities.canManageMaterials} onEdit={handleEdit} onDelete={handleDelete} />
        <MaterialList kind="submaterial" items={submaterialItems} isSaving={isSaving} canManageMaterials={capabilities.canManageMaterials} onEdit={handleEdit} onDelete={handleDelete} />
      </section>
    </div>
  );
}
