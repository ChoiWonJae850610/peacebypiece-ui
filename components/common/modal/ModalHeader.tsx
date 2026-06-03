"use client";

import { WaflModalCloseButton, getWaflModalHeaderClassName } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";


type ModalHeaderProps = {
  titleId: string;
  title: string;
  description?: string;
  descriptionId?: string;
  onClose: () => void;
};

export default function ModalHeader({
  titleId,
  title,
  description,
  descriptionId,
  onClose,
}: ModalHeaderProps) {
  const { i18n } = useI18n();
  return (
    <div className={getWaflModalHeaderClassName()}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div id={titleId} className="text-base font-semibold md:text-lg pbp-text-primary">
            {title}
          </div>
          {description ? (
            <div id={descriptionId} className="mt-1 break-keep text-sm pbp-text-muted">
              {description}
            </div>
          ) : null}
        </div>
        <WaflModalCloseButton label={i18n.common.ui.common.close} onClose={onClose} />
      </div>
    </div>
  );
}
