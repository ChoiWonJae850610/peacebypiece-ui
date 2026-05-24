"use client";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  MATERIAL_KIND_LABELS,
  MATERIAL_ORDER_STATUS_LABELS,
  MATERIAL_UNIT_LABELS,
  WORKORDER_MATERIAL_LINE_ROLE_LABELS,
} from "@/lib/materials/constants";
import type { MaterialUnit, WorkorderMaterialLineRole } from "@/lib/materials/types";
import { useWorkOrderMaterialLines } from "@/features/workorders/material-lines/useWorkOrderMaterialLines";

const INPUT_CLASS_NAME = "min-h-9 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 outline-none focus:border-stone-400";

type WorkOrderMaterialLinesPanelProps = {
  workorderId: string;
  locked?: boolean;
};

export default function WorkOrderMaterialLinesPanel({ workorderId, locked = false }: WorkOrderMaterialLinesPanelProps) {
  const controller = useWorkOrderMaterialLines(workorderId, locked);
  const isBusy = controller.isLoading || controller.isSaving;

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-stone-900">기준정보 연결</h4>
            <AdminStatusBadge tone="info">DB 연결</AdminStatusBadge>
          </div>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            /workspace/materials에 등록한 원단·부자재 기준정보를 이 작업지시서에 연결합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void controller.refresh(); }}
          disabled={isBusy}
          className="pbp-interactive-button rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {controller.message ? (
        <p className="mt-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-500">{controller.message}</p>
      ) : null}

      {controller.materials.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white px-3 py-5 text-center text-xs text-stone-500">
          연결 가능한 원단·부자재 기준정보가 없습니다. 먼저 원단·부자재 화면에서 기준 항목을 등록해야 합니다.
        </div>
      ) : (
        <div className="mt-3 grid gap-2 lg:grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_1fr_auto] lg:items-end">
          <label className="grid gap-1 text-[11px] font-semibold text-stone-500">
            기준 항목
            <select
              className={INPUT_CLASS_NAME}
              value={controller.draft.materialId}
              onChange={(event) => controller.selectMaterial(event.target.value)}
              disabled={locked || isBusy}
            >
              {controller.materials.map((item) => (
                <option key={item.id} value={item.id}>
                  [{MATERIAL_KIND_LABELS[item.kind]}] {item.name} · {item.code}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[11px] font-semibold text-stone-500">
            역할
            <select
              className={INPUT_CLASS_NAME}
              value={controller.draft.role}
              onChange={(event) => controller.updateDraft({ role: event.target.value as WorkorderMaterialLineRole })}
              disabled={locked || isBusy}
            >
              {Object.entries(WORKORDER_MATERIAL_LINE_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[11px] font-semibold text-stone-500">
            필요 수량
            <input
              className={INPUT_CLASS_NAME}
              value={controller.draft.requiredQuantity}
              onChange={(event) => controller.updateDraft({ requiredQuantity: event.target.value })}
              inputMode="decimal"
              placeholder="0"
              disabled={locked || isBusy}
            />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold text-stone-500">
            단위
            <select
              className={INPUT_CLASS_NAME}
              value={controller.draft.unit}
              onChange={(event) => controller.updateDraft({ unit: event.target.value as MaterialUnit })}
              disabled={locked || isBusy}
            >
              {Object.entries(MATERIAL_UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[11px] font-semibold text-stone-500">
            메모
            <input
              className={INPUT_CLASS_NAME}
              value={controller.draft.memo}
              onChange={(event) => controller.updateDraft({ memo: event.target.value })}
              placeholder="선택 입력"
              disabled={locked || isBusy}
            />
          </label>
          <button
            type="button"
            onClick={() => { void controller.addLine(); }}
            disabled={locked || isBusy || !controller.draft.materialId}
            className="pbp-interactive-button rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            연결
          </button>
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
        {controller.lines.length === 0 ? (
          <div className="px-3 py-5 text-center text-xs text-stone-500">이 작업지시서에 연결된 원단·부자재 기준정보가 없습니다.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {controller.lines.map((line) => (
              <article key={line.id} className="grid gap-2 px-3 py-3 text-xs md:grid-cols-[1.2fr_0.7fr_0.6fr_0.8fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-stone-900">{line.material.name}</span>
                    <span className="rounded-full border border-stone-200 px-2 py-0.5 text-[10px] text-stone-500">{line.material.code}</span>
                    <span className="rounded-full border border-stone-200 px-2 py-0.5 text-[10px] text-stone-500">{MATERIAL_KIND_LABELS[line.material.kind]}</span>
                  </div>
                  {line.memo ? <p className="mt-1 text-stone-500">{line.memo}</p> : null}
                </div>
                <div className="text-stone-600">{WORKORDER_MATERIAL_LINE_ROLE_LABELS[line.role]}</div>
                <div className="text-stone-600">{line.requiredQuantity ?? "-"} {MATERIAL_UNIT_LABELS[line.unit]}</div>
                <div><AdminStatusBadge tone="neutral">{MATERIAL_ORDER_STATUS_LABELS[line.orderStatus]}</AdminStatusBadge></div>
                <button
                  type="button"
                  onClick={() => { void controller.deleteLine(line.id); }}
                  disabled={locked || isBusy}
                  className="pbp-interactive-button rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-600 disabled:opacity-50"
                >
                  연결 해제
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
