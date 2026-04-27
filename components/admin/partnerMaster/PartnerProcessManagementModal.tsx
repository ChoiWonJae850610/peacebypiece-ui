"use client";

import StatusToggle from "@/components/common/StatusToggle";
import ModalShell from "@/components/common/modal/ModalShell";
import { type OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster";
import { useI18n } from "@/lib/i18n";
import type { OutsourcingProcessType } from "@/types/partner";

type PartnerProcessManagementModalProps = {
  open: boolean;
  newProcessLabel: string;
  processFormError: string;
  orderedProcessDefinitions: OutsourcingProcessDefinition[];
  onClose: () => void;
  onResetDefaults: () => void;
  onNewProcessLabelChange: (value: string) => void;
  onAddProcessDefinition: () => void;
  onUpdateProcessDefinition: (
    type: OutsourcingProcessType,
    updater: (current: OutsourcingProcessDefinition) => OutsourcingProcessDefinition,
  ) => void;
  onRequestDelete: (type: OutsourcingProcessType) => void;
  onClearProcessFormError: () => void;
};

export default function PartnerProcessManagementModal({
  open,
  newProcessLabel,
  processFormError,
  orderedProcessDefinitions,
  onClose,
  onResetDefaults,
  onNewProcessLabelChange,
  onAddProcessDefinition,
  onUpdateProcessDefinition,
  onRequestDelete,
  onClearProcessFormError,
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </label>
          <button
            type="button"
            onClick={onAddProcessDefinition}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            {processText.add}
          </button>
        </div>
        {processFormError ? <p className="mt-2 text-sm font-medium text-rose-600">{processFormError}</p> : null}
      </div>

      <div className="space-y-3">
        {orderedProcessDefinitions.map((definition) => (
            <div key={definition.type} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <label className="min-w-0 flex-1 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{processText.displayName}</span>
                  <input
                    value={definition.label}
                    onChange={(event) => {
                      onUpdateProcessDefinition(definition.type, (current) => ({ ...current, label: event.target.value }));
                      if (processFormError) onClearProcessFormError();
                    }}
                    placeholder={processText.newProcessPlaceholder}
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <div className="flex items-center gap-2">
                    <StatusToggle
                      checked={definition.isActive}
                      onChange={(nextValue) => onUpdateProcessDefinition(definition.type, (current) => ({ ...current, isActive: nextValue }))}
                      srLabel={`${definition.label}${processText.usageSrLabelSuffix}`}
                      size="sm"
                    />
                    <span className={`text-sm font-medium ${definition.isActive ? "text-stone-900" : "text-stone-500"}`}>
                      {definition.isActive ? processText.active : processText.inactive}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRequestDelete(definition.type)}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    {processText.delete}
                  </button>
                </div>
              </div>
            </div>
        ))}
      </div>
    </ModalShell>
  );
}
