"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_INPUT_CLASS, MODAL_SELECT_CLASS, MODAL_TEXTAREA_CLASS } from "@/components/common/modal/modalFieldClassNames";
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
      footer={(
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {copy.save}
        </button>
      )}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <label className="text-xs text-stone-500">{copy.typeLabel}</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as RegistryType)}
            className={`mt-2 ${MODAL_SELECT_CLASS}`}
          >
            {REGISTRY_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {typeOptionLabels[option as RegistryType]}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <label htmlFor="registry-name" className="text-xs text-stone-500">{copy.nameLabel}</label>
          <input
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
            className={`mt-2 ${MODAL_SELECT_CLASS}`}
          />
          <p className="mt-2 text-xs text-stone-500">{copy.savedNotice}</p>
        </div>
      </div>
    </ModalShell>
  );
}
