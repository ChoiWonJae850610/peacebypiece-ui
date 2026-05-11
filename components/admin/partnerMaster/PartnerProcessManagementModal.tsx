"use client";

import {
  AdminModalFooterActions,
  AdminModalSection,
  adminModalInputClassName,
} from "@/components/admin/layout/AdminModal";
import StandardManagementModalFrame, {
  standardModalAddButtonClassName,
  standardModalListBoxClassName,
  standardModalListScrollClassName,
  standardModalMutedRowClassName,
  standardModalSelectedRowClassName,
} from "@/components/admin/standards/StandardManagementModalFrame";
import { PARTNER_MASTER_FIELD_LIMITS, type OutsourcingProcessDefinition } from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";
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
    <div className={`h-[240px] ${standardModalListBoxClassName}`}>
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
  newProcessLabel,
  processFormError,
  inactiveProcessDefinitions,
  activeProcessDefinitions,
  selectedInactiveProcess,
  selectedActiveProcess,
  onClose,
  onSave,
  onResetDefaults,
  saving = false,
  onNewProcessLabelChange,
  onAddProcessDefinition,
  onSetProcessActive,
  onClearProcessFormError,
  onSelectInactiveProcess,
  onSelectActiveProcess,
}: PartnerProcessManagementModalProps) {
  const { i18n } = useI18n();
  const processText = i18n.admin.partnerMaster.processManagement;

  return (
    <StandardManagementModalFrame
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={processText.title}
      description="작업지시서의 외주 처리에 쓰는 단순 공정 기준값을 사용/미사용 목록으로 관리합니다."
      categoryLabel="단순 목록 기준정보"
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
      <AdminModalSection title={processText.addSectionTitle}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="min-w-0 flex-1 space-y-2">
            <input
              value={newProcessLabel}
              maxLength={PARTNER_MASTER_FIELD_LIMITS.outsourcingProcessLabel}
              disabled={saving}
              onChange={(event) => {
                onNewProcessLabelChange(event.target.value);
                if (processFormError) onClearProcessFormError();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!saving) onAddProcessDefinition();
                }
              }}
              placeholder={processText.newProcessPlaceholder}
              className={`h-11 ${adminModalInputClassName}`}
            />
          </label>
          <button
            type="button"
            onClick={onAddProcessDefinition}
            disabled={saving}
            className={standardModalAddButtonClassName}
          >
            {processText.add}
          </button>
        </div>
      </AdminModalSection>

      <AdminModalSection title={processText.usageSectionTitle}>
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
          <button
            type="button"
            onClick={() => {
              if (saving || !selectedInactiveProcess) return;
              onSetProcessActive(selectedInactiveProcess, true);
              onSelectActiveProcess(selectedInactiveProcess);
              onSelectInactiveProcess(null);
            }}
            disabled={saving || !selectedInactiveProcess}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={processText.activateSelected}
          >
            <span className="block -rotate-90">▾</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (saving || !selectedActiveProcess) return;
              onSetProcessActive(selectedActiveProcess, false);
              onSelectInactiveProcess(selectedActiveProcess);
              onSelectActiveProcess(null);
            }}
            disabled={saving || !selectedActiveProcess}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={processText.deactivateSelected}
          >
            <span className="block rotate-90">▾</span>
          </button>
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
