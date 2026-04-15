"use client";

import { useI18n } from "@/lib/i18n";

type PartnerMasterHeaderProps = {
  onOpenProcessModal: () => void;
  onOpenCreateModal: () => void;
};

export default function PartnerMasterHeader({ onOpenProcessModal, onOpenCreateModal }: PartnerMasterHeaderProps) {
  const { i18n } = useI18n();
  const headerText = i18n.admin.partnerMaster.header;

  return (
    <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{headerText.eyebrow}</p>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">{headerText.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{headerText.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenProcessModal}
          className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          {headerText.manageProcesses}
        </button>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          {headerText.createPartner}
        </button>
      </div>
    </div>
  );
}
