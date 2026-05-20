"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import {
  AdminModalFooterActions,
  AdminModalSection,
} from "@/components/admin/layout/AdminModal";
import StandardManagementModalFrame, {
  standardModalListBoxClassName,
  standardModalListScrollClassName,
  standardModalMutedRowClassName,
  standardModalSelectedRowClassName,
} from "@/components/admin/standards/StandardManagementModalFrame";
import { type OutsourcingProcessDefinition } from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { OutsourcingProcessType } from "@/types/partner";

type PartnerProcessManagementModalProps = {
  open: boolean;
  newProcessLabel: string;
  processFormError: string;
  inactiveProcessDefinitions: OutsourcingProcessDefinition[];
  activeProcessDefinitions: OutsourcingProcessDefinition[];
  selectedInactiveProcess: OutsourcingProcessType | null;
  selectedActiveProcess: OutsourcingProcessType | null;
  onClose: () => void;
  onSave: () => void;
  onResetDefaults: () => void;
  saving?: boolean;
  onNewProcessLabelChange: (value: string) => void;
  onAddProcessDefinition: () => void;
  onSetProcessActive: (type: OutsourcingProcessType, isActive: boolean) => void;
  onClearProcessFormError: () => void;
  onSelectInactiveProcess: (type: OutsourcingProcessType | null) => void;
  onSelectActiveProcess: (type: OutsourcingProcessType | null) => void;
};

function ProcessListBox({
  items,
  selectedType,
  emptyLabel,
  onSelect,
}: {
  items: OutsourcingProcessDefinition[];
  selectedType: OutsourcingProcessType | null;
  emptyLabel: string;
  onSelect: (type: OutsourcingProcessType | null) => void;
}) {
  return (
    <div className={`h-[300px] ${standardModalListBoxClassName}`}>
      <div className={standardModalListScrollClassName}>
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{emptyLabel}</div>
        ) : (
          items.map((definition) => {
            const isSelected = selectedType === definition.type;
            return (
              <button
                key={definition.type}
                type="button"
                onClick={() => onSelect(definition.type)}
                className={[
                  "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                  isSelected ? standardModalSelectedRowClassName : standardModalMutedRowClassName,
                ].join(" ")}
              >
                <span className="min-w-0 max-w-full truncate font-medium" title={definition.label}>{definition.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PartnerProcessManagementModal({
  open,
  processFormError,
  inactiveProcessDefinitions,
  activeProcessDefinitions,
  selectedInactiveProcess,
  selectedActiveProcess,
  onClose,
  onSave,
  onResetDefaults,
  saving = false,
  onSetProcessActive,
  onSelectInactiveProcess,
  onSelectActiveProcess,
}: PartnerProcessManagementModalProps) {
  const { i18n } = useI18n();
  const t = useAdminTranslation();
  const processText = i18n.admin.partnerMaster.processManagement;

  return (
    <StandardManagementModalFrame
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={processText.title}
      description={t("partnerMaster.processManagement.description", "시스템관리자가 제공하는 외주공정 표준 목록 중 이 고객사가 사용할 항목만 선택합니다. 새 공정 유형이 필요하면 개선 요청 또는 관리자 문의로 요청하세요.")}
      categoryLabel={t("standards.common.systemSelectableCategory", "시스템 표준 선택형 기준정보")}
      maxWidthClass="md:max-w-3xl"
      footer={
        <AdminModalFooterActions
          secondaryLabel={processText.resetDefaults}
          primaryLabel={saving ? i18n.admin.standards.common.saving : processText.save}
          onSecondary={onResetDefaults}
          onPrimary={onSave}
          secondaryDisabled={saving}
          primaryDisabled={saving}
          statusMessage={processFormError}
          statusTone={processFormError ? "danger" : "neutral"}
        />
      }
    >
      <AdminModalSection title={processText.usageSectionTitle}>
        <div className="mb-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs leading-5 text-stone-500">
          {t("partnerMaster.processManagement.usageNotice", "외주공정 유형은 전체 고객사의 작업지시서와 통계 기준을 맞추기 위해 시스템 표준값을 사용합니다. 고객관리자는 필요한 공정만 사용 목록으로 이동합니다.")}
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-800">{processText.inactiveListTitle}</p>
            <ProcessListBox
              items={inactiveProcessDefinitions}
              selectedType={selectedInactiveProcess}
              emptyLabel={processText.inactiveEmpty}
              onSelect={(type) => {
                if (saving) return;
                onSelectInactiveProcess(type);
                onSelectActiveProcess(null);
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 md:flex-col">
            <AdminButton
              type="button"
              onClick={() => {
                if (saving || !selectedInactiveProcess) return;
                onSetProcessActive(selectedInactiveProcess, true);
                onSelectActiveProcess(selectedInactiveProcess);
                onSelectInactiveProcess(null);
              }}
              disabled={saving || !selectedInactiveProcess}
              variant="secondary"
              size="sm"
              className="h-8 w-8 px-0 py-0"
              aria-label={processText.activateSelected}
            >
              <span className="block -rotate-90">▾</span>
            </AdminButton>
            <AdminButton
              type="button"
              onClick={() => {
                if (saving || !selectedActiveProcess) return;
                onSetProcessActive(selectedActiveProcess, false);
                onSelectInactiveProcess(selectedActiveProcess);
                onSelectActiveProcess(null);
              }}
              disabled={saving || !selectedActiveProcess}
              variant="secondary"
              size="sm"
              className="h-8 w-8 px-0 py-0"
              aria-label={processText.deactivateSelected}
            >
              <span className="block rotate-90">▾</span>
            </AdminButton>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-800">{processText.activeListTitle}</p>
            <ProcessListBox
              items={activeProcessDefinitions}
              selectedType={selectedActiveProcess}
              emptyLabel={processText.activeEmpty}
              onSelect={(type) => {
                if (saving) return;
                onSelectActiveProcess(type);
                onSelectInactiveProcess(null);
              }}
            />
          </div>
        </div>
      </AdminModalSection>
    </StandardManagementModalFrame>
  );
}
