"use client";

import { useI18n } from "@/lib/i18n";

type AdminNotificationSettingsButtonProps = {
  onClick: () => void;
};

export default function AdminNotificationSettingsButton({ onClick }: AdminNotificationSettingsButtonProps) {
  const { i18n } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={i18n.admin.notificationModal.title}
      title={i18n.admin.notificationModal.title}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-base font-medium text-stone-700 transition hover:bg-stone-50"
    >
      <span aria-hidden="true">🔔</span>
    </button>
  );
}
