"use client";

import { useEffect, useState } from "react";
import { AdminModal, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import { ADMIN_RETENTION_DAY_OPTIONS } from "@/lib/admin/adminSettings.presentation";
import { runSaveCompanySettingsFlow } from "@/lib/admin/adminSettings.actionFlow";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import type { CompanySettings } from "@/lib/admin/companySettings.types";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";

type AdminFilePolicySettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

function ToggleButtonGroup({ label, activeLabel, inactiveLabel, checked, onChange }: { label: string; activeLabel: string; inactiveLabel: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-950">{label}</p>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`min-w-[96px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${checked ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-stone-900 bg-stone-950 text-white"}`}
        >
          {checked ? activeLabel : inactiveLabel}
        </button>
      </div>
    </div>
  );
}

export default function AdminFilePolicySettingsModal({ open, onClose }: AdminFilePolicySettingsModalProps) {
  const defaultSettings = buildDefaultCompanySettings(WORKSPACE_COMPANY_ID);
  const [draft, setDraft] = useState<CompanySettings>(() => defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    fetch("/api/admin/companies/current", { method: "GET", cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { settings?: CompanySettings; message?: string }) => {
        if (!isMounted) return;
        if (payload.settings) setDraft(payload.settings);
        else if (payload.message) setErrorMessage(payload.message);
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "파일 정책을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  function handleReset() {
    setDraft((current) => ({
      ...current,
      filePolicy: { ...defaultSettings.filePolicy },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    const result = await runSaveCompanySettingsFlow(draft);
    setSaving(false);
    if (!result.ok || !result.settings) {
      setErrorMessage(result.message || "파일 정책을 저장하지 못했습니다.");
      return;
    }
    setDraft(result.settings);
    onClose();
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="파일 정책 관리"
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={handleReset} className={adminModalSecondaryButtonClassName}>
            기본값 복원
          </button>
          <button type="button" onClick={handleSave} disabled={saving || loading} className={adminModalPrimaryButtonClassName}>
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      }
    >
      <div className="grid min-h-[232px] gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        {errorMessage ? <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{errorMessage}</p> : null}

        <ToggleButtonGroup
          label="삭제 방식"
          activeLabel="휴지통"
          inactiveLabel="즉시 삭제"
          checked={draft.filePolicy.softDeleteEnabled}
          onChange={(softDeleteEnabled) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, softDeleteEnabled } }))}
        />
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-sm font-semibold text-stone-950">실제 삭제 기간</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {ADMIN_RETENTION_DAY_OPTIONS.map((days) => {
              const selected = draft.filePolicy.trashRetentionDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, trashRetentionDays: days } }))}
                  className={`w-full rounded-full border px-3 py-2 text-sm font-semibold transition ${selected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                >
                  {days}일
                </button>
              );
            })}
          </div>
        </div>

        <label className="grid gap-2 rounded-3xl border border-stone-200 bg-stone-50 p-3 text-sm">
          <span className="font-semibold text-stone-900">용량 경고 기준(%)</span>
          <input
            type="number"
            min={1}
            max={100}
            value={draft.filePolicy.warningThresholdPercent}
            onChange={(event) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, warningThresholdPercent: Number(event.target.value) } }))}
            className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
        </label>
      </div>
    </AdminModal>
  );
}
