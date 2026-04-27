"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { type OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster";
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
  onResetDefaults: () => void;
  onNewProcessLabelChange: (value: string) => void;
  onAddProcessDefinition: () => void;
  onSetProcessActive: (type: OutsourcingProcessType, isActive: boolean) => void;
  onRequestDelete: (type: OutsourcingProcessType) => void;
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
    <div className="h-[240px] rounded-2xl border border-stone-200 bg-stone-50 p-2">
      <div className="h-full space-y-2 overflow-auto pr-1">
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
                  isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                ].join(" ")}
              >
                <span className="font-medium">{definition.label}</span>
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
  onResetDefaults,
  onNewProcessLabelChange,
  onAddProcessDefinition,
  onSetProcessActive,
  onRequestDelete,
  onClearProcessFormError,
  onSelectInactiveProcess,
  onSelectActiveProcess,
}: PartnerProcessManagementModalProps) {
  const { i18n } = useI18n();
  const processText = i18n.admin.partnerMaster.processManagement;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={processText.title}
      description={processText.description}
      maxWidthClass="md:max-w-3xl"
      bodyClassName="space-y-4"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={onResetDefaults}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            {processText.resetDefaults}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            {processText.close}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="min-w-0 flex-1 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{processText.newProcessLabel}</span>
            <input
              value={newProcessLabel}
              onChange={(event) => {
                onNewProcessLabelChange(event.target.value);
                if (processFormError) onClearProcessFormError();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddProcessDefinition();
                }
              }}
              placeholder={processText.newProcessPlaceholder}
              className="h-11 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-500"
            />
          </label>
          <button
            type="button"
            onClick={onAddProcessDefinition}
            className="inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            {processText.add}
          </button>
        </div>
        {processFormError ? <p className="mt-2 text-sm font-medium text-rose-600">{processFormError}</p> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-800">미사용 외주공정</p>
          <ProcessListBox
            items={inactiveProcessDefinitions}
            selectedType={selectedInactiveProcess}
            emptyLabel="미사용 외주공정이 없습니다."
            onSelect={(type) => {
              onSelectInactiveProcess(type);
              onSelectActiveProcess(null);
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 md:flex-col">
          <button
            type="button"
            onClick={() => {
              if (!selectedInactiveProcess) return;
              onSetProcessActive(selectedInactiveProcess, true);
              onSelectActiveProcess(selectedInactiveProcess);
              onSelectInactiveProcess(null);
            }}
            disabled={!selectedInactiveProcess}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="선택한 외주공정을 사용중으로 변경"
          >
            <span className="block -rotate-90">▾</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedActiveProcess) return;
              onSetProcessActive(selectedActiveProcess, false);
              onSelectInactiveProcess(selectedActiveProcess);
              onSelectActiveProcess(null);
            }}
            disabled={!selectedActiveProcess}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="선택한 외주공정을 미사용으로 변경"
          >
            <span className="block rotate-90">▾</span>
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-800">사용중 외주공정</p>
          <ProcessListBox
            items={activeProcessDefinitions}
            selectedType={selectedActiveProcess}
            emptyLabel="사용중 외주공정이 없습니다."
            onSelect={(type) => {
              onSelectActiveProcess(type);
              onSelectInactiveProcess(null);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {[...inactiveProcessDefinitions, ...activeProcessDefinitions].map((definition) => (
          <button
            key={definition.type}
            type="button"
            onClick={() => onRequestDelete(definition.type)}
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
          >
            {definition.label} {processText.delete}
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
