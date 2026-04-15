"use client";

import { useI18n } from "@/lib/i18n";

type AdminWorkOrderHistoryButtonProps = {
  onClick: () => void;
};

export default function AdminWorkOrderHistoryButton({ onClick }: AdminWorkOrderHistoryButtonProps) {
  const { i18n } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
    >
      {i18n.common.viewWorkOrderHistory}
    </button>
  );
}
