"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  Material,
  MaterialUnit,
  WorkorderMaterialLineRole,
  WorkorderMaterialLineWithMaterial,
} from "@/lib/materials/types";

export type WorkOrderMaterialLineDraft = {
  materialId: string;
  role: WorkorderMaterialLineRole;
  requiredQuantity: string;
  unit: MaterialUnit;
  memo: string;
};

type WorkOrderMaterialLinesApiResponse = {
  materials?: Material[];
  lines?: WorkorderMaterialLineWithMaterial[];
  error?: string;
};

export const EMPTY_WORKORDER_MATERIAL_LINE_DRAFT: WorkOrderMaterialLineDraft = {
  materialId: "",
  role: "main_fabric",
  requiredQuantity: "",
  unit: "yd",
  memo: "",
};

async function requestWorkOrderMaterialLinesApi(
  method: "GET" | "POST" | "DELETE",
  workorderId: string,
  body?: Record<string, unknown>,
): Promise<WorkOrderMaterialLinesApiResponse> {
  const query = method === "GET" ? `?workorderId=${encodeURIComponent(workorderId)}` : "";
  const response = await fetch(`/api/workorders/material-lines${query}`, {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as WorkOrderMaterialLinesApiResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "WORKORDER_MATERIAL_LINES_API_ERROR");
  }

  return payload ?? { materials: [], lines: [] };
}

function normalizeInitialDraft(materials: Material[], current: WorkOrderMaterialLineDraft): WorkOrderMaterialLineDraft {
  if (current.materialId) return current;
  const first = materials[0];
  if (!first) return current;
  return {
    ...current,
    materialId: first.id,
    unit: first.unit,
    role: first.kind === "fabric" ? "main_fabric" : "trim",
  };
}

export function useWorkOrderMaterialLines(workorderId: string, locked = false) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lines, setLines] = useState<WorkorderMaterialLineWithMaterial[]>([]);
  const [draft, setDraft] = useState<WorkOrderMaterialLineDraft>(EMPTY_WORKORDER_MATERIAL_LINE_DRAFT);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === draft.materialId) ?? null,
    [draft.materialId, materials],
  );

  useEffect(() => {
    if (!workorderId) return;
    let cancelled = false;
    setIsLoading(true);
    setMessage(null);

    void requestWorkOrderMaterialLinesApi("GET", workorderId)
      .then((payload) => {
        if (cancelled) return;
        const nextMaterials = Array.isArray(payload.materials) ? payload.materials : [];
        setMaterials(nextMaterials);
        setLines(Array.isArray(payload.lines) ? payload.lines : []);
        setDraft((current) => normalizeInitialDraft(nextMaterials, current));
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "WORKORDER_MATERIAL_LINES_LOAD_FAILED");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workorderId]);

  const updateDraft = (patch: Partial<WorkOrderMaterialLineDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const selectMaterial = (materialId: string) => {
    const material = materials.find((item) => item.id === materialId);
    setDraft((current) => ({
      ...current,
      materialId,
      unit: material?.unit ?? current.unit,
      role: material?.kind === "fabric" ? "main_fabric" : material?.kind === "submaterial" ? "trim" : current.role,
    }));
  };

  const refresh = async () => {
    if (!workorderId) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const payload = await requestWorkOrderMaterialLinesApi("GET", workorderId);
      const nextMaterials = Array.isArray(payload.materials) ? payload.materials : [];
      setMaterials(nextMaterials);
      setLines(Array.isArray(payload.lines) ? payload.lines : []);
      setDraft((current) => normalizeInitialDraft(nextMaterials, current));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WORKORDER_MATERIAL_LINES_REFRESH_FAILED");
    } finally {
      setIsLoading(false);
    }
  };

  const addLine = async () => {
    if (locked || !workorderId || !draft.materialId) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = await requestWorkOrderMaterialLinesApi("POST", workorderId, {
        workorderId,
        materialId: draft.materialId,
        role: draft.role,
        requiredQuantity: draft.requiredQuantity,
        unit: draft.unit,
        memo: draft.memo,
      });
      setMaterials(Array.isArray(payload.materials) ? payload.materials : []);
      setLines(Array.isArray(payload.lines) ? payload.lines : []);
      setDraft((current) => ({ ...EMPTY_WORKORDER_MATERIAL_LINE_DRAFT, materialId: current.materialId, unit: current.unit, role: current.role }));
      setMessage("원단·부자재 기준정보를 작업지시서에 연결했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WORKORDER_MATERIAL_LINE_CREATE_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLine = async (lineId: string) => {
    if (locked || !workorderId || !lineId) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = await requestWorkOrderMaterialLinesApi("DELETE", workorderId, { workorderId, lineId });
      setMaterials(Array.isArray(payload.materials) ? payload.materials : []);
      setLines(Array.isArray(payload.lines) ? payload.lines : []);
      setMessage("작업지시서 원단·부자재 연결을 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WORKORDER_MATERIAL_LINE_DELETE_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    materials,
    lines,
    draft,
    selectedMaterial,
    isLoading,
    isSaving,
    message,
    updateDraft,
    selectMaterial,
    refresh,
    addLine,
    deleteLine,
  };
}
