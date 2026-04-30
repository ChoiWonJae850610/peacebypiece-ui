"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { useI18n } from "@/lib/i18n";

type PartnerMasterHeaderProps = {
  onOpenCreateModal: () => void;
};

export default function PartnerMasterHeader({ onOpenCreateModal }: PartnerMasterHeaderProps) {
  const { i18n } = useI18n();
  const headerText = i18n.admin.partnerMaster.header;

  return (
    <AdminActionBar title={headerText.title} description={headerText.description} className="border-b border-stone-200 pb-5 xl:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--admin-theme-surface)] px-4 text-sm font-semibold text-[var(--admin-theme-text-on-surface)] shadow-sm transition hover:bg-[var(--admin-theme-surface-hover)]"
        >
          + {headerText.createPartner}
        </button>
      </div>
    </AdminActionBar>
  );
}
