"use client";

import { useI18n } from "@/lib/i18n";

type PartnerMasterHeaderProps = {
  onOpenCreateModal: () => void;
};

export default function PartnerMasterHeader({ onOpenCreateModal }: PartnerMasterHeaderProps) {
  const { i18n } = useI18n();
  const headerText = i18n.admin.partnerMaster.header;

  return (
    <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="min-w-0 max-w-3xl text-sm leading-6 text-stone-500 md:text-[13px]">{headerText.description}</p>
      <button
        type="button"
        onClick={onOpenCreateModal}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-theme-surface)] px-4 text-sm font-semibold text-[var(--admin-theme-text-on-surface)] shadow-sm transition hover:bg-[var(--admin-theme-surface-hover)]"
      >
        + {headerText.createPartner}
      </button>
    </div>
  );
}
