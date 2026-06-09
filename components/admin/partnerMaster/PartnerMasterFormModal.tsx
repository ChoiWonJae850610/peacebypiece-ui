"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { WaflInfoBox, WaflInput, WaflSelectableCard, WaflTextarea } from "@/components/common/ui";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import StatusToggle from "@/components/common/StatusToggle";
import {
  AdminModal,
  AdminModalSection,
  adminModalLabelClassName,
} from "@/components/admin/layout/AdminModal";
import {
  BASE_PARTNER_TYPE_VALUES,
  PARTNER_TYPE_META,
  PARTNER_MASTER_FIELD_LIMITS,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";
import { formatPhoneNumber } from "@/lib/utils/phoneFormat";
import type { OutsourcingProcessType, PartnerDraft } from "@/types/partner";

type PartnerMasterFormModalProps = {
  open: boolean;
  editingPartnerId: string | null;
  draft: PartnerDraft;
  formError: string;
  isSubmitting?: boolean;
  selectedPrimaryTypes: BasePartnerType[];
  isOutsourcingEnabled: boolean;
  availableProcessDefinitions: OutsourcingProcessDefinition[];
  assignedProcessDefinitions: OutsourcingProcessDefinition[];
  selectedAvailableProcess: OutsourcingProcessType | null;
  selectedAssignedProcess: OutsourcingProcessType | null;
  onClose: () => void;
  canEdit?: boolean;
  onSubmit: () => void;
  onDraftChange: (updater: (current: PartnerDraft) => PartnerDraft) => void;
  onSetPrimaryType: (type: BasePartnerType) => void;
  onToggleOutsourcingProcess: (type: OutsourcingProcessType) => void;
  onSelectAvailableProcess: (type: OutsourcingProcessType | null) => void;
  onSelectAssignedProcess: (type: OutsourcingProcessType | null) => void;
};

export default function PartnerMasterFormModal({
  open,
  editingPartnerId,
  draft,
  formError,
  isSubmitting = false,
  selectedPrimaryTypes,
  isOutsourcingEnabled,
  availableProcessDefinitions,
  assignedProcessDefinitions,
  selectedAvailableProcess,
  selectedAssignedProcess,
  onClose,
  canEdit = true,
  onSubmit,
  onDraftChange,
  onSetPrimaryType,
  onToggleOutsourcingProcess,
  onSelectAvailableProcess,
  onSelectAssignedProcess,
}: PartnerMasterFormModalProps) {
  const { i18n } = useI18n();
  const formText = i18n.admin.partnerMaster.form;

  return (
    <AdminModal
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={editingPartnerId ? formText.editTitle : formText.createTitle}
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-xs text-rose-600">{formError}</p>
          <div className="flex items-center gap-2">
            <AdminButton type="button" onClick={onClose} disabled={isSubmitting} variant="secondary">
              {formText.cancel}
            </AdminButton>
            <AdminButton type="button" onClick={onSubmit} disabled={isSubmitting || !canEdit} variant="primary">
              {formText.save}
            </AdminButton>
          </div>
        </div>
      }
    >
      <AdminModalSection title={formText.sections.basic}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="partner-name" className={adminModalLabelClassName}>{formText.labels.name}</label>
          <WaflInput
            id="partner-name"
            value={draft.name}
            maxLength={PARTNER_MASTER_FIELD_LIMITS.name}
            onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))}
            placeholder={formText.placeholders.name}
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
            <AdminStatusBadge tone={draft.isActive ? "success" : "neutral"}>
              {draft.isActive ? formText.usageActive : formText.usageInactive}
            </AdminStatusBadge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="partner-contact-name" className={adminModalLabelClassName}>{formText.labels.contactName}</label>
          <WaflInput
            id="partner-contact-name"
            value={draft.contactName}
            maxLength={PARTNER_MASTER_FIELD_LIMITS.contactName}
            onChange={(event) => onDraftChange((current) => ({ ...current, contactName: event.target.value }))}
            placeholder={formText.placeholders.contactName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="partner-phone" className={adminModalLabelClassName}>{formText.labels.phone} <span className="text-rose-500">*</span></label>
          <WaflInput
            id="partner-phone"
            type="tel"
            value={draft.phone}
            inputMode="numeric"
            pattern="[0-9]*"
            required
            maxLength={PARTNER_MASTER_FIELD_LIMITS.phone}
            onChange={(event) => onDraftChange((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }))}
            placeholder={formText.placeholders.phone}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="partner-email" className={adminModalLabelClassName}>{formText.labels.email}</label>
          <WaflInput
            id="partner-email"
            type="email"
            inputMode="email"
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            value={draft.email}
            maxLength={PARTNER_MASTER_FIELD_LIMITS.email}
            onChange={(event) => onDraftChange((current) => ({ ...current, email: event.target.value }))}
            placeholder={formText.placeholders.email}
          />
        </div>
      </div>
      </AdminModalSection>

      <AdminModalSection title={formText.sections.category}>
      <div className="space-y-3">
        <div className="space-y-2">
          <p className={adminModalLabelClassName}>{formText.labels.baseTypes}</p>
          <div className="grid gap-2 sm:grid-cols-4">
            {BASE_PARTNER_TYPE_VALUES.map((type) => {
              const checked = selectedPrimaryTypes.includes(type);
              return (
                <WaflSelectableCard
                  key={type}
                  onClick={() => onSetPrimaryType(type)}
                  aria-pressed={checked}
                  selected={checked}
                  component="partner-type-card"
                  className="justify-center px-4 py-3 text-center text-sm font-semibold"
                >
                  {formText.typeLabels?.[type] ?? PARTNER_TYPE_META[type].shortLabel}
                </WaflSelectableCard>
              );
            })}
          </div>
        </div>

        {isOutsourcingEnabled ? (
          <WaflInfoBox component="partner-outsourcing-process-panel" className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-800">{formText.labels.outsourcingProcesses}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center">
              <div className="space-y-2">
                <WaflInfoBox component="partner-process-list" tone="muted" className="h-[220px] p-2">
                  <div className="h-full space-y-2 overflow-auto pr-1">
                    {availableProcessDefinitions.length === 0 ? (
                      <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{formText.noAvailableProcesses}</div>
                    ) : (
                      availableProcessDefinitions.map((definition) => {
                        const isSelected = selectedAvailableProcess === definition.type;
                        return (
                          <WaflSelectableCard
                            key={definition.type}
                            onClick={() => {
                              onSelectAvailableProcess(definition.type);
                              onSelectAssignedProcess(null);
                            }}
                            selected={isSelected}
                            component="partner-process-option"
                            className="px-3 py-3 text-sm"
                          >
                            <span className="min-w-0 max-w-full truncate font-medium" title={definition.label}>{definition.label}</span>
                          </WaflSelectableCard>
                        );
                      })
                    )}
                  </div>
                </WaflInfoBox>
              </div>

              <div className="flex items-center justify-center gap-2 md:flex-col">
                <AdminButton
                  type="button"
                  onClick={() => {
                    if (!selectedAvailableProcess) return;
                    onToggleOutsourcingProcess(selectedAvailableProcess);
                    onSelectAssignedProcess(selectedAvailableProcess);
                    onSelectAvailableProcess(null);
                  }}
                  disabled={!selectedAvailableProcess}
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 px-0 py-0"
                  aria-label={formText.addSelectedProcess}
                >
                  <span className="block -rotate-90">▾</span>
                </AdminButton>
                <AdminButton
                  type="button"
                  onClick={() => {
                    if (!selectedAssignedProcess) return;
                    onToggleOutsourcingProcess(selectedAssignedProcess);
                    onSelectAvailableProcess(selectedAssignedProcess);
                    onSelectAssignedProcess(null);
                  }}
                  disabled={!selectedAssignedProcess}
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 px-0 py-0"
                  aria-label={formText.removeSelectedProcess}
                >
                  <span className="block rotate-90">▾</span>
                </AdminButton>
              </div>

              <div className="space-y-2">
                <WaflInfoBox component="partner-process-list" tone="muted" className="h-[220px] p-2">
                  <div className="h-full space-y-2 overflow-auto pr-1">
                    {assignedProcessDefinitions.length === 0 ? (
                      <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{formText.noAssignedProcesses}</div>
                    ) : (
                      assignedProcessDefinitions.map((definition) => {
                        const isSelected = selectedAssignedProcess === definition.type;
                        return (
                          <WaflSelectableCard
                            key={definition.type}
                            onClick={() => {
                              onSelectAssignedProcess(definition.type);
                              onSelectAvailableProcess(null);
                            }}
                            selected={isSelected}
                            component="partner-process-option"
                            className="px-3 py-3 text-sm"
                          >
                            <span className="min-w-0 max-w-full truncate font-medium" title={definition.label}>{definition.label}</span>
                          </WaflSelectableCard>
                        );
                      })
                    )}
                  </div>
                </WaflInfoBox>
              </div>
            </div>
          </WaflInfoBox>
        ) : null}
      </div>
      </AdminModalSection>

      <AdminModalSection title={formText.sections.memo}>
      <div className="space-y-2">
        <label htmlFor="partner-memo" className={adminModalLabelClassName}>{formText.labels.memo}</label>
        <WaflTextarea
          id="partner-memo"
          value={draft.memo}
          maxLength={PARTNER_MASTER_FIELD_LIMITS.memo}
          onChange={(event) => onDraftChange((current) => ({ ...current, memo: event.target.value }))}
          rows={4}
          placeholder={formText.placeholders.memo}
        />
      </div>
      </AdminModalSection>
    </AdminModal>
  );
}
