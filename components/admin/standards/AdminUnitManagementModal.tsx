"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminModal,
  AdminModalSection,
  adminModalInputClassName,
  adminModalPrimaryButtonClassName,
  adminModalSecondaryButtonClassName,
} from "@/components/admin/layout/AdminModal";
import { createDefaultUnitDefinitions } from "@/lib/admin/settings/standardsDefaults";
import type { AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type Props = {
  open: boolean;
  units: AdminUnitDefinition[];
  saving?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (units: AdminUnitDefinition[]) => void;
};

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createUnitId(code: string) {
  return `unit:${code}:${Date.now()}`;
}

export default function AdminUnitManagementModal({ open, units, saving = false, error = "", onClose, onSave }: Props) {
  const t = useAdminTranslation();
  const [draft, setDraft] = useState<AdminUnitDefinition[]>(units);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(units);
    setNewName("");
    setNewCode("");
    setFormError("");
  }, [open, units]);

  const sortedDraft = useMemo(() => draft.slice().sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR")), [draft]);

  const addUnit = () => {
    const name = normalizeLabel(newName);
    const code = normalizeLabel(newCode).toLowerCase();
    if (!name || !code) {
      setFormError(t("standards.units.nameRequired", "단위명과 코드를 입력하세요."));
      return;
    }
    if (draft.some((unit) => unit.code === code || unit.name === name)) {
      setFormError(t("standards.units.duplicate", "이미 등록된 단위입니다."));
      return;
    }
    setDraft((current) => [
      ...current,
      { id: createUnitId(code), code, name, category: "count", is_active: true, sort_order: (current.length + 1) * 10 },
    ]);
    setNewName("");
    setNewCode("");
    setFormError("");
  };

  const toggleUnit = (id: string) => {
    setDraft((current) => current.map((unit) => (unit.id === id ? { ...unit, is_active: !unit.is_active } : unit)));
  };

  const resetDraft = () => {
    setDraft(createDefaultUnitDefinitions());
    setNewName("");
    setNewCode("");
    setFormError("");
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={t("standards.units.title", "단위 표준")}
      maxWidthClass="md:max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={resetDraft} className={adminModalSecondaryButtonClassName}>{t("standards.common.resetDefaults", "기본값 복원")}</button>
          <button type="button" onClick={() => onSave(draft)} disabled={saving} className={adminModalPrimaryButtonClassName}>{saving ? t("standards.common.saving", "저장 중") : t("standards.common.save", "저장")}</button>
        </div>
      }
    >
      <AdminModalSection title={t("standards.units.addTitle", "단위 추가")}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={newName} onChange={(event) => { setNewName(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.units.namePlaceholder", "단위명 예: 개")} className={`h-11 ${adminModalInputClassName}`} />
          <input value={newCode} onChange={(event) => { setNewCode(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.units.codePlaceholder", "코드 예: piece")} className={`h-11 ${adminModalInputClassName}`} />
          <button type="button" onClick={addUnit} className="h-11 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white">{t("standards.common.add", "추가")}</button>
        </div>
        {formError || error ? <p className="mt-2 text-sm font-semibold text-rose-600">{formError || error}</p> : null}
      </AdminModalSection>

      <AdminModalSection title={t("standards.units.usageTitle", "단위 사용 여부")}>
        <div className="h-[360px] rounded-3xl border border-stone-200 bg-stone-50/70 p-2">
          <div className="h-full space-y-2 overflow-auto pr-1">
            {sortedDraft.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => toggleUnit(unit.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm hover:border-stone-300"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-stone-950">{unit.name}</span>
                  <span className="block text-xs text-stone-400">{unit.code}</span>
                </span>
                <span className={["rounded-full px-2.5 py-1 text-xs font-semibold", unit.is_active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"].join(" ")}>{unit.is_active ? t("standards.common.active", "사용") : t("standards.common.inactive", "미사용")}</span>
              </button>
            ))}
          </div>
        </div>
      </AdminModalSection>
    </AdminModal>
  );
}
