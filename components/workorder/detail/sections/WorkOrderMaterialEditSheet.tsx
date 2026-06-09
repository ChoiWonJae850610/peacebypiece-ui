"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { AppNumberInput, AppSelect, type AppSelectOption } from "@/components/common/ui";
import { MATERIAL_TYPE, MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT } from "@/lib/constants/material";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { useI18n } from "@/lib/i18n";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import type { Material } from "@/types/workorder";

export type MaterialSheetDraft = {
  type: Material["type"];
  name: string;
  quantity: number;
  unit: Material["unit"];
};

type Props = {
  open: boolean;
  material: Material | null;
  unitOptions: string[];
  onClose: () => void;
  onApply: (materialId: string | null, draft: MaterialSheetDraft) => void;
};

const fieldPanelClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold text-[var(--pbp-text-muted)]";
const inputClass = "min-h-11 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 text-base font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-border-strong)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--pbp-surface)] md:text-sm";

function toDraft(material: Material | null): MaterialSheetDraft {
  return {
    type: material?.type ?? MATERIAL_TYPE.fabric,
    name: material?.name ?? "",
    quantity: material?.quantity ?? 0,
    unit: material?.unit ?? MATERIAL_UNIT.yard,
  };
}

export default function WorkOrderMaterialEditSheet({ open, material, unitOptions, onClose, onApply }: Props) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.material;
  const [draft, setDraft] = useState<MaterialSheetDraft>(() => toDraft(material));

  useEffect(() => {
    if (open) {
      setDraft(toDraft(material));
    }
  }, [material, open]);

  const typeOptions = useMemo<AppSelectOption[]>(() => MATERIAL_TYPE_OPTIONS.map((value) => ({
    value,
    label: translateWorkOrderDisplayText(value, locale),
  })), [locale]);

  const resolvedUnitOptions = unitOptions.length > 0 ? unitOptions : Object.values(MATERIAL_UNIT);
  const unitSelectOptions = useMemo<AppSelectOption[]>(() => resolvedUnitOptions.map((value) => ({
    value,
    label: translateWorkOrderDisplayText(value, locale),
  })), [locale, resolvedUnitOptions]);

  const trimmedName = draft.name.trim();
  const applyDisabled = trimmedName.length === 0;

  const handleApply = () => {
    blurActiveModalElement();
    if (applyDisabled) return;
    onApply(material?.id ?? null, {
      ...draft,
      name: trimmedName,
      quantity: Number.isFinite(draft.quantity) ? Math.max(0, draft.quantity) : 0,
    });
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={material ? copy.editSheetTitle : copy.addSheetTitle}
      description={copy.editSheetDescription}
      maxWidthClass="md:max-w-lg"
      bodyClassName="pbp-mobile-no-zoom"
      footer={renderModalFooterActions({
        layout: "end",
        primary: { label: MODAL_ACTION_LABELS.apply, onClick: handleApply, disabled: applyDisabled, tone: "primary" },
      })}
    >
      <div className="grid gap-4">
        <div className={fieldPanelClass}>
          <label className={labelClass}>{copy.fields.type}</label>
          <AppSelect
            value={draft.type}
            options={typeOptions}
            onValueChange={(nextValue) => { blurActiveModalElement(); setDraft((current) => ({ ...current, type: nextValue as Material["type"] })); }}
            ariaLabel={copy.fields.type}
            contentClassName="z-[4000]"
          />
        </div>
        <div className={fieldPanelClass}>
          <label className={labelClass} htmlFor="workorder-material-sheet-name">{copy.fields.name}</label>
          <input
            id="workorder-material-sheet-name"
            type="text"
            value={draft.name}
            placeholder={copy.namePlaceholder}
            onPointerDown={() => blurActiveModalElement()}
            onTouchStart={() => blurActiveModalElement()}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={fieldPanelClass}>
            <label className={labelClass} htmlFor="workorder-material-sheet-quantity">{copy.fields.quantity}</label>
            <AppNumberInput
              id="workorder-material-sheet-quantity"
              inputMode="decimal"
              value={draft.quantity}
              onBeforeInteract={() => blurActiveModalElement()}
              onValueChange={(value) => setDraft((current) => ({ ...current, quantity: value }))}
              className={inputClass}
            />
          </div>
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.unit}</label>
            <AppSelect
              value={draft.unit}
              options={unitSelectOptions}
              onValueChange={(nextValue) => { blurActiveModalElement(); setDraft((current) => ({ ...current, unit: nextValue as Material["unit"] })); }}
              ariaLabel={copy.fields.unit}
              contentClassName="z-[4000]"
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
