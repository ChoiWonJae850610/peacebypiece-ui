"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { buildDeleteOutsourcingProcessConfirmCopy } from "@/lib/admin/partnerMasterConfirm";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster";
import { useI18n } from "@/lib/i18n";
import type { OutsourcingProcessType } from "@/types/partner";

type PartnerProcessDeleteModalProps = {
  deletingProcessType: OutsourcingProcessType | null;
  orderedProcessDefinitions: OutsourcingProcessDefinition[];
  onClose: () => void;
  onConfirm: () => void;
};

export default function PartnerProcessDeleteModal({
  deletingProcessType,
  orderedProcessDefinitions,
  onClose,
  onConfirm,
}: PartnerProcessDeleteModalProps) {
  const { i18n } = useI18n();
  const deletingLabel = deletingProcessType
    ? orderedProcessDefinitions.find((definition) => definition.type === deletingProcessType)?.label ?? deletingProcessType
    : null;
  const confirmCopy = buildDeleteOutsourcingProcessConfirmCopy(deletingLabel, i18n.admin.partnerMaster.confirm);

  return (
    <ModalShell
      open={Boolean(deletingProcessType)}
      onClose={onClose}
      title={confirmCopy.title}
      description={confirmCopy.description}
      maxWidthClass="md:max-w-lg"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            {confirmCopy.cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            {confirmCopy.confirmLabel}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{confirmCopy.body}</div>
    </ModalShell>
  );
}
