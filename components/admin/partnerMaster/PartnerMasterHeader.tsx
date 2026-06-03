"use client";

import { Plus } from "lucide-react";

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
    <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pbp-brand-soft)]">
          {headerText.eyebrow || "Partner network"}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--pbp-text-primary)] md:text-3xl">
          {headerText.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)] md:text-[13px]">
          {headerText.description}
        </p>
      </div>
      {canCreate ? (
        <AdminButton
          type="button"
          onClick={onOpenCreateModal}
          variant="primary"
          size="sm"
          className="w-full md:w-auto"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{headerText.createPartner}</span>
        </AdminButton>
      ) : null}
    </div>
  );
}
