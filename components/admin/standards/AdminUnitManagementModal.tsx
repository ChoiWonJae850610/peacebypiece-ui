"use client";

import { useEffect, useMemo, useState } from "react";
import AdminUsageToggle from "@/components/admin/common/AdminUsageToggle";
import {
  AdminModalFooterActions,
  AdminModalSection,
  adminModalInputClassName,
} from "@/components/admin/layout/AdminModal";
import StandardManagementModalFrame, {
  standardModalAddButtonClassName,
  standardModalListBoxClassName,
  standardModalListScrollClassName,
  standardModalRowClassName,
} from "@/components/admin/standards/StandardManagementModalFrame";
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
    <StandardManagementModalFrame
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={t("standards.units.title", "단위 표준")}
      description="작업지시서 수량과 발주 단위에 쓰는 한글명과 영문 코드/약어를 함께 관리합니다."
      categoryLabel="다국어 단위 기준정보"
      maxWidthClass="md:max-w-3xl"
      footer={
        <AdminModalFooterActions
          secondaryLabel={t("standards.common.resetDefaults", "기본값 복원")}
          primaryLabel={saving ? t("standards.common.saving", "저장 중") : t("standards.common.save", "저장")}
          onSecondary={resetDraft}
          onPrimary={() => onSave(draft)}
          secondaryDisabled={saving}
          primaryDisabled={saving}
          statusMessage={formError || error}
          statusTone={formError || error ? "danger" : "neutral"}
        />
      }
    >
      <AdminModalSection title={t("standards.units.addTitle", "단위 추가")}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={newName} onChange={(event) => { setNewName(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.units.namePlaceholder", "단위명 예: 개")} disabled={saving} className={`h-11 ${adminModalInputClassName}`} />
          <input disabled={saving} value={newCode} onChange={(event) => { setNewCode(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.units.codePlaceholder", "코드 예: piece")} className={`h-11 ${adminModalInputClassName}`} />
          <button type="button" onClick={addUnit} disabled={saving} className={standardModalAddButtonClassName}>{t("standards.common.add", "추가")}</button>
        </div>
      </AdminModalSection>

      <AdminModalSection title={t("standards.units.usageTitle", "단위 사용 여부")}>
        <div className={`h-[360px] ${standardModalListBoxClassName}`}>
          <div className={standardModalListScrollClassName}>
            {sortedDraft.map((unit) => (
              <div
                key={unit.id}
                className={standardModalRowClassName}
              >
                <button type="button" onClick={() => toggleUnit(unit.id)} disabled={saving} className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-60">
                  <span className="block font-semibold text-stone-950">{unit.name}</span>
                  <span className="block text-xs text-stone-400">{unit.code}</span>
                </button>
                <AdminUsageToggle
                  label={`${unit.name} ${t("standards.units.usageTitle", "단위 사용 여부")}`}
                  checked={unit.is_active}
                  activeLabel={t("standards.common.active", "사용")}
                  inactiveLabel={t("standards.common.inactive", "미사용")}
                  disabled={saving}
                  variant="inline"
                  onChange={() => toggleUnit(unit.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </AdminModalSection>
    </StandardManagementModalFrame>
  );
}
