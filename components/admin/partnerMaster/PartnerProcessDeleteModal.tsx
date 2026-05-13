"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminModal, AdminModalSection } from "@/components/admin/layout/AdminModal";
import { buildDeleteOutsourcingProcessConfirmCopy } from "@/lib/admin/partner/confirm";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner";
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
    <AdminModal
      open={Boolean(deletingProcessType)}
      onClose={onClose}
      title={confirmCopy.title}
      description={confirmCopy.description}
      maxWidthClass="md:max-w-lg"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <AdminButton type="button" onClick={onClose} variant="secondary">
            {confirmCopy.cancelLabel}
          </AdminButton>
          <AdminButton type="button" onClick={onConfirm} variant="danger">
            {confirmCopy.confirmLabel}
          </AdminButton>
        </div>
      }
    >
      <AdminModalSection className="border-rose-100 bg-rose-50 text-sm leading-6 text-rose-700">{confirmCopy.body}</AdminModalSection>
    </AdminModal>
  );
}
