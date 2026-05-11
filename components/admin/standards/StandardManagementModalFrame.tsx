"use client";

import { AdminModal } from "@/components/admin/layout/AdminModal";
import type { ReactNode } from "react";

type StandardManagementModalFrameProps = {
  open: boolean;
  title: string;
  description: string;
  categoryLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  maxWidthClass?: string;
};

export const standardModalAddButtonClassName =
  "inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50";

export const standardModalListBoxClassName =
  "rounded-3xl border border-stone-200 bg-stone-50/70 p-2";

export const standardModalListScrollClassName =
  "h-full space-y-2 overflow-auto pr-1";

export const standardModalRowClassName =
  "flex w-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-left text-sm transition hover:border-stone-300";

export const standardModalSelectedRowClassName =
  "border-stone-950 bg-white text-stone-950 shadow-sm";

export const standardModalMutedRowClassName =
  "border-stone-200 bg-white text-stone-700 hover:border-stone-300";

export default function StandardManagementModalFrame({
  open,
  title,
  description,
  categoryLabel,
  onClose,
  children,
  footer,
  maxWidthClass = "md:max-w-3xl",
}: StandardManagementModalFrameProps) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClass={maxWidthClass}
      bodyClassName="space-y-3 bg-stone-50/60 [scrollbar-gutter:stable]"
      footer={footer}
    >
      <div className="rounded-3xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-stone-950">{categoryLabel}</p>
          <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">기준정보 관리</span>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-stone-500">{description}</p>
      </div>
      {children}
    </AdminModal>
  );
}
