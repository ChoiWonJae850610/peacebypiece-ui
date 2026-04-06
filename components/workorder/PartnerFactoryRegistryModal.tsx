"use client";

import { useEffect, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { DEFAULT_REGISTRY_TYPE, REGISTRY_TYPE_OPTIONS } from "@/lib/constants/workorderOptions";

export type RegistryType = "거래처" | "공장";

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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [type, setType] = useState<RegistryType>(initialType);
  const [name, setName] = useState("");

  useModalEnvironment({ open, dialogRef, onClose });

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
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="partner-factory-registry-modal-title" maxWidthClassName="md:max-w-lg">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:py-4">
        <div>
          <h2 id="partner-factory-registry-modal-title" className="text-base font-semibold text-stone-900 md:text-lg">거래처 / 공장 등록</h2>
          <p className="mt-1 text-xs text-stone-500 md:text-sm">현재 선택 필드에 바로 사용할 수 있도록 목록에 추가합니다.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          닫기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <label className="text-xs text-stone-500">등록 구분</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as RegistryType)}
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
            >
              {REGISTRY_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <label htmlFor="registry-name" className="text-xs text-stone-500">이름</label>
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
              placeholder={`${type}명을 입력하세요`}
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
            />
            <p className="mt-2 text-xs text-stone-500">저장하면 현재 화면의 선택 목록에 즉시 추가됩니다.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white px-4 py-3 md:px-6 md:py-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          저장
        </button>
      </div>
    </BaseModal>
  );
}
