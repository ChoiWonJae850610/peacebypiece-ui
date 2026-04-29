"use client";

import { useI18n } from "@/lib/i18n";

type PartnerMasterHeaderProps = {
  onOpenCreateModal: () => void;
  onOpenProcessModal?: () => void;
};

export default function PartnerMasterHeader({ onOpenCreateModal, onOpenProcessModal }: PartnerMasterHeaderProps) {
  const { i18n } = useI18n();
  const headerText = i18n.admin.partnerMaster.header;

  return (
    <div className="flex flex-col gap-5 border-b border-stone-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0 space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-stone-950 md:text-2xl">{headerText.title}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onOpenProcessModal ? (
          <button
            type="button"
            onClick={onOpenProcessModal}
            className="inline-flex h-10 items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
          >
            {headerText.manageProcesses}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--admin-theme-surface)] px-4 text-sm font-semibold text-[var(--admin-theme-text-on-surface)] shadow-sm transition hover:bg-[var(--admin-theme-surface-hover)]"
        >
          + {headerText.createPartner}
        </button>
      </div>
    </div>
  );
}
