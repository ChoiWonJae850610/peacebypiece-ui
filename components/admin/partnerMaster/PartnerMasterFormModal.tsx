"use client";

import StatusToggle from "@/components/common/StatusToggle";
import {
  AdminModal,
  AdminModalSection,
  adminModalInputClassName,
  adminModalLabelClassName,
  adminModalPrimaryButtonClassName,
  adminModalSecondaryButtonClassName,
} from "@/components/admin/layout/AdminModal";
import {
  BASE_PARTNER_TYPE_VALUES,
  PARTNER_TYPE_META,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { useI18n } from "@/lib/i18n";
import { formatPhoneNumber } from "@/lib/utils/phoneFormat";
import type { OutsourcingProcessType, PartnerDraft } from "@/types/partner";

type PartnerMasterFormModalProps = {
  open: boolean;
  editingPartnerId: string | null;
  draft: PartnerDraft;
  formError: string;
  selectedPrimaryTypes: BasePartnerType[];
  isOutsourcingEnabled: boolean;
  availableProcessDefinitions: OutsourcingProcessDefinition[];
  assignedProcessDefinitions: OutsourcingProcessDefinition[];
  selectedAvailableProcess: OutsourcingProcessType | null;
  selectedAssignedProcess: OutsourcingProcessType | null;
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (updater: (current: PartnerDraft) => PartnerDraft) => void;
  onSetPrimaryType: (type: BasePartnerType) => void;
  onToggleOutsourcingProcess: (type: OutsourcingProcessType) => void;
  onOpenProcessModal: () => void;
  onSelectAvailableProcess: (type: OutsourcingProcessType | null) => void;
  onSelectAssignedProcess: (type: OutsourcingProcessType | null) => void;
};

export default function PartnerMasterFormModal({
  open,
  editingPartnerId,
  draft,
  formError,
  selectedPrimaryTypes,
  isOutsourcingEnabled,
  availableProcessDefinitions,
  assignedProcessDefinitions,
  selectedAvailableProcess,
  selectedAssignedProcess,
  onClose,
  onSubmit,
  onDraftChange,
  onSetPrimaryType,
  onToggleOutsourcingProcess,
  onOpenProcessModal,
  onSelectAvailableProcess,
  onSelectAssignedProcess,
}: PartnerMasterFormModalProps) {
  const { i18n } = useI18n();
  const formText = i18n.admin.partnerMaster.form;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={editingPartnerId ? formText.editTitle : formText.createTitle}
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-xs text-rose-600">{formError}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={adminModalSecondaryButtonClassName}
            >
              {formText.cancel}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className={adminModalPrimaryButtonClassName}
            >
              {formText.save}
            </button>
          </div>
        </div>
      }
    >
      <AdminModalSection title="기본 정보">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="partner-name" className={adminModalLabelClassName}>{formText.labels.name}</label>
          <input
            id="partner-name"
            value={draft.name}
            onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))}
            placeholder={formText.placeholders.name}
            className={adminModalInputClassName}
          />
        </div>

        <div className="space-y-2">
          <p className={adminModalLabelClassName}>{formText.labels.active}</p>
          <div className="flex min-h-[48px] items-center gap-3">
            <StatusToggle
              checked={draft.isActive}
              onChange={(nextValue) => onDraftChange((current) => ({ ...current, isActive: nextValue }))}
              srLabel={formText.usageSrLabel}
              size="sm"
            />
            <span className={`text-sm font-medium ${draft.isActive ? "text-stone-900" : "text-stone-500"}`}>
              {draft.isActive ? formText.usageActive : formText.usageInactive}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="partner-contact-name" className={adminModalLabelClassName}>{formText.labels.contactName}</label>
          <input
            id="partner-contact-name"
            value={draft.contactName}
            onChange={(event) => onDraftChange((current) => ({ ...current, contactName: event.target.value }))}
            placeholder={formText.placeholders.contactName}
            className={adminModalInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="partner-phone" className={adminModalLabelClassName}>{formText.labels.phone}</label>
          <input
            id="partner-phone"
            type="tel"
            value={draft.phone}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => onDraftChange((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }))}
            placeholder={formText.placeholders.phone}
            className={adminModalInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="partner-email" className={adminModalLabelClassName}>{formText.labels.email}</label>
          <input
            id="partner-email"
            type="email"
            value={draft.email}
            onChange={(event) => onDraftChange((current) => ({ ...current, email: event.target.value }))}
            placeholder={formText.placeholders.email}
            className={adminModalInputClassName}
          />
        </div>
      </div>
      </AdminModalSection>

      <AdminModalSection title="분류와 외주공정">
      <div className="space-y-3">
        <div className="space-y-2">
          <p className={adminModalLabelClassName}>{formText.labels.baseTypes}</p>
          <div className="grid gap-2 sm:grid-cols-4">
            {BASE_PARTNER_TYPE_VALUES.map((type) => {
              const checked = selectedPrimaryTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSetPrimaryType(type)}
                  aria-pressed={checked}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                    checked ? "border-sky-300 bg-sky-50 text-sky-900 shadow-sm" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                  ].join(" ")}
                >
                  {PARTNER_TYPE_META[type].shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {isOutsourcingEnabled ? (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-800">{formText.labels.outsourcingProcesses}</p>
              <button
                type="button"
                onClick={onOpenProcessModal}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
              >
                {formText.manageProcesses}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center">
              <div className="space-y-2">
                <div className="h-[220px] rounded-2xl border border-stone-200 bg-stone-50 p-2">
                  <div className="h-full space-y-2 overflow-auto pr-1">
                    {availableProcessDefinitions.length === 0 ? (
                      <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{formText.noAvailableProcesses}</div>
                    ) : (
                      availableProcessDefinitions.map((definition) => {
                        const isSelected = selectedAvailableProcess === definition.type;
                        return (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => {
                              onSelectAvailableProcess(definition.type);
                              onSelectAssignedProcess(null);
                            }}
                            className={[
                              "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                              isSelected ? "border-sky-300 bg-sky-50 text-sky-900 shadow-sm" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                            ].join(" ")}
                          >
                            <span className="font-medium">{definition.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 md:flex-col">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedAvailableProcess) return;
                    onToggleOutsourcingProcess(selectedAvailableProcess);
                    onSelectAssignedProcess(selectedAvailableProcess);
                    onSelectAvailableProcess(null);
                  }}
                  disabled={!selectedAvailableProcess}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={formText.addSelectedProcess}
                >
                  <span className="block -rotate-90">▾</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedAssignedProcess) return;
                    onToggleOutsourcingProcess(selectedAssignedProcess);
                    onSelectAvailableProcess(selectedAssignedProcess);
                    onSelectAssignedProcess(null);
                  }}
                  disabled={!selectedAssignedProcess}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={formText.removeSelectedProcess}
                >
                  <span className="block rotate-90">▾</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="h-[220px] rounded-2xl border border-stone-200 bg-stone-50 p-2">
                  <div className="h-full space-y-2 overflow-auto pr-1">
                    {assignedProcessDefinitions.length === 0 ? (
                      <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{formText.noAssignedProcesses}</div>
                    ) : (
                      assignedProcessDefinitions.map((definition) => {
                        const isSelected = selectedAssignedProcess === definition.type;
                        return (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => {
                              onSelectAssignedProcess(definition.type);
                              onSelectAvailableProcess(null);
                            }}
                            className={[
                              "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                              isSelected ? "border-sky-300 bg-sky-50 text-sky-900 shadow-sm" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                            ].join(" ")}
                          >
                            <span className="font-medium">{definition.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      </AdminModalSection>

      <AdminModalSection title="메모">
      <div className="space-y-2">
        <label htmlFor="partner-memo" className={adminModalLabelClassName}>{formText.labels.memo}</label>
        <textarea
          id="partner-memo"
          value={draft.memo}
          onChange={(event) => onDraftChange((current) => ({ ...current, memo: event.target.value }))}
          rows={4}
          placeholder={formText.placeholders.memo}
          className={adminModalInputClassName}
        />
      </div>
      </AdminModalSection>
    </AdminModal>
  );
}
