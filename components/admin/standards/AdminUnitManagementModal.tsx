"use client";

import { useEffect, useMemo, useState } from "react";
import AdminUsageToggle from "@/components/admin/common/AdminUsageToggle";
import {
  AdminModalFooterActions,
  AdminModalSection,
} from "@/components/admin/layout/AdminModal";
import StandardManagementModalFrame, {
  standardModalListBoxClassName,
  standardModalListScrollClassName,
  standardModalRowClassName,
} from "@/components/admin/standards/StandardManagementModalFrame";
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

export default function AdminUnitManagementModal({ open, units, saving = false, error = "", onClose, onSave }: Props) {
  const t = useAdminTranslation();
  const [draft, setDraft] = useState<AdminUnitDefinition[]>(units);

  useEffect(() => {
    if (!open) return;
    setDraft(units);
  }, [open, units]);

  const sortedDraft = useMemo(
    () => draft.slice().sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR")),
    [draft],
  );

  const toggleUnit = (id: string) => {
    setDraft((current) => current.map((unit) => (unit.id === id ? { ...unit, is_active: !unit.is_active } : unit)));
  };

  const resetDraft = () => {
    setDraft((current) => current.map((unit) => ({ ...unit, is_active: true })));
  };

  return (
    <StandardManagementModalFrame
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={t("standards.units.title", "단위 표준")}
      description={t("standards.units.description", "시스템관리자가 제공하는 단위 표준 목록 중 이 고객사가 사용할 항목만 선택합니다. 새 단위 추가가 필요하면 개발 건의 또는 관리자 문의로 요청하세요.")}
      categoryLabel={t("standards.common.systemSelectableCategory", "시스템 표준 선택형 기준정보")}
      maxWidthClass="md:max-w-3xl"
      footer={
        <AdminModalFooterActions
          secondaryLabel={t("standards.common.resetDefaults", "기본값 복원")}
          primaryLabel={saving ? t("standards.common.saving", "저장 중") : t("standards.common.save", "저장")}
          onSecondary={resetDraft}
          onPrimary={() => onSave(draft)}
          secondaryDisabled={saving}
          primaryDisabled={saving}
          statusMessage={error}
          statusTone={error ? "danger" : "neutral"}
        />
      }
    >
      <AdminModalSection title={t("standards.units.usageTitle", "단위 사용 여부")}> 
        <div className="mb-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs leading-5 text-stone-500">
          {t("standards.units.usageNotice", "단위명과 영문 코드/약어는 시스템 표준값을 사용합니다. 고객관리자는 작업지시서에서 노출할 단위만 사용/미사용으로 선택합니다.")}
        </div>
        <div className={`h-[410px] ${standardModalListBoxClassName}`}>
          <div className={standardModalListScrollClassName}>
            {sortedDraft.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm leading-6 text-stone-400">
                시스템 단위 표준 seed가 없습니다. 시스템관리자 기준정보에서 단위 표준을 먼저 등록하세요.
              </div>
            ) : (
              sortedDraft.map((unit) => (
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
              ))
            )}
          </div>
        </div>
      </AdminModalSection>
    </StandardManagementModalFrame>
  );
}
