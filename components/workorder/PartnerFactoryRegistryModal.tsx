"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { AppSelect, WaflInput } from "@/components/common/ui";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
import { MODAL_CONTENT_LABEL_CLASS, MODAL_CONTENT_SECTION_PANEL_CLASS, MODAL_CONTENT_SUBTEXT_CLASS } from "@/components/common/modal/modalContentClassNames";
import { DEFAULT_REGISTRY_TYPE, REGISTRY_TYPE_OPTIONS } from "@/lib/constants/workorderOptions";
import { REGISTRY_TYPE, type RegistryTypeValue } from "@/lib/constants/workorderDomain";
import { useI18n } from "@/lib/i18n";

export type RegistryType = RegistryTypeValue;

type PartnerFactoryRegistryModalProps = {
  open: boolean;
  initialType?: RegistryType;
  onClose: () => void;
  onSave: (payload: { type: RegistryType; name: string }) => void;
};

export default function PartnerFactoryRegistryModal({
  open,
  initialType = DEFAULT_REGISTRY_TYPE as RegistryType,
  onClose,
  onSave,
}: PartnerFactoryRegistryModalProps) {
  const [type, setType] = useState<RegistryType>(initialType);
  const [name, setName] = useState("");
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.layout.partnerFactoryRegistry;
  const typeOptionLabels: Record<RegistryType, string> = {
    [REGISTRY_TYPE.partner]: copy.typeOptions.partner,
    [REGISTRY_TYPE.factory]: copy.typeOptions.factory,
    [REGISTRY_TYPE.materialVendor]: copy.typeOptions.materialVendor,
    [REGISTRY_TYPE.subsidiaryVendor]: copy.typeOptions.subsidiaryVendor,
  };

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setName("");
  }, [initialType, open]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ type, name: trimmed });
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "split",
        secondary: { label: i18n.common.ui.common.cancel, onClick: onClose, width: "fill" },
        primary: { label: copy.save, onClick: handleSave, disabled: !name.trim(), tone: "primary", width: "fill" },
      })}
    >
      <div className="space-y-4">
        <div className={MODAL_CONTENT_SECTION_PANEL_CLASS}>
          <label className={MODAL_CONTENT_LABEL_CLASS}>{copy.typeLabel}</label>
          <AppSelect
            value={type}
            onValueChange={(nextType) => setType(nextType as RegistryType)}
            options={REGISTRY_TYPE_OPTIONS.map((option) => ({
              value: option,
              label: typeOptionLabels[option as RegistryType],
            }))}
            className="mt-2"
            ariaLabel={copy.typeLabel}
          />
        </div>

        <div className={MODAL_CONTENT_SECTION_PANEL_CLASS}>
          <label htmlFor="registry-name" className={MODAL_CONTENT_LABEL_CLASS}>{copy.nameLabel}</label>
          <WaflInput
            id="registry-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
              }
            }}
            placeholder={`${typeOptionLabels[type]}${copy.namePlaceholderPrefix}`}
            className="mt-2"
          />
          <p className={`mt-2 ${MODAL_CONTENT_SUBTEXT_CLASS}`}>{copy.savedNotice}</p>
        </div>
      </div>
    </ModalShell>
  );
}
