"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { useI18n } from "@/lib/i18n";

type PartnerMasterHeaderProps = {
  canCreate?: boolean;
  onOpenCreateModal: () => void;
};

export default function PartnerMasterHeader({ canCreate = true, onOpenCreateModal }: PartnerMasterHeaderProps) {
  const { i18n } = useI18n();
  const headerText = i18n.admin.partnerMaster.header;

  return (
    <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="min-w-0 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)] md:text-[13px]">{headerText.description}</p>
      {canCreate ? (
        <AdminButton type="button" onClick={onOpenCreateModal} variant="primary" size="md" className="whitespace-nowrap">
          + {headerText.createPartner}
        </AdminButton>
      ) : null}
    </div>
  );
}
