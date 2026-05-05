"use client";

import { useI18n } from "@/lib/i18n";


type ModalHeaderProps = {
  titleId: string;
  title: string;
  description?: string;
  onClose: () => void;
};

export default function ModalHeader({
  titleId,
  title,
  description,
  onClose,
}: ModalHeaderProps) {
  const { i18n } = useI18n();
  return (
    <div className="sticky top-0 z-20 shrink-0 border-b px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur md:px-6 md:pb-4 md:pt-4 pbp-modal-chrome">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div id={titleId} className="text-base font-semibold md:text-lg pbp-text-primary">
            {title}
          </div>
          {description ? <div className="mt-1 break-keep text-sm pbp-text-muted">{description}</div> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition active:scale-[0.97] pbp-button-surface"
        >
          {i18n.common.ui.common.close}
        </button>
      </div>
    </div>
  );
}
