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
    <div className="flex flex-col gap-5 border-b border-stone-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">MASTER DATA</p>
        <h2 className="text-xl font-semibold tracking-tight text-stone-950 md:text-2xl">{headerText.title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-stone-500">거래처, 공장, 원단, 부자재, 외주처 정보를 같은 기준으로 정리합니다.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenProcessModal}
          className="inline-flex h-10 items-center justify-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          {headerText.manageProcesses}
        </button>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex h-10 items-center justify-center rounded-full bg-stone-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
        >
          + {headerText.createPartner}
        </button>
      </div>
    </div>
  );
}
