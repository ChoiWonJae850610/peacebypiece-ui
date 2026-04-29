"use client";

import { useEffect, useState } from "react";
import { AdminModal, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import { runSaveCompanySettingsFlow } from "@/lib/admin/adminSettings.actionFlow";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import type { CompanySettings } from "@/lib/admin/companySettings.types";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";

type AdminNotificationPolicySettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const POLICY_ITEMS: Array<{
  key: keyof CompanySettings["notificationPolicy"];
  label: string;
}> = [
  { key: "reviewRequestEnabled", label: "검토 요청" },
  { key: "orderReadyEnabled", label: "발주 준비" },
  { key: "storageWarningEnabled", label: "용량 경고" },
  { key: "purgeResultEnabled", label: "삭제 결과" },
];

export default function AdminNotificationPolicySettingsModal({ open, onClose }: AdminNotificationPolicySettingsModalProps) {
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
        setErrorMessage(error instanceof Error ? error.message : "알림 정책을 불러오지 못했습니다.");
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
      notificationPolicy: { ...defaultSettings.notificationPolicy },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    const result = await runSaveCompanySettingsFlow(draft);
    setSaving(false);
    if (!result.ok || !result.settings) {
      setErrorMessage(result.message || "알림 정책을 저장하지 못했습니다.");
      return;
    }
    setDraft(result.settings);
    onClose();
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="알림 정책"
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
      <div className="grid min-h-[252px] content-start gap-2 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        {errorMessage ? <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{errorMessage}</p> : null}
        {POLICY_ITEMS.map((item) => {
          const checked = draft.notificationPolicy[item.key];
          return (
            <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3">
              <span className="min-w-0 flex-1 text-sm font-medium text-stone-900">{item.label}</span>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    notificationPolicy: {
                      ...current.notificationPolicy,
                      [item.key]: !current.notificationPolicy[item.key],
                    },
                  }))
                }
                className={`min-w-[88px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${checked ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-stone-900 bg-stone-950 text-white"}`}
              >
                {checked ? "사용" : "미사용"}
              </button>
            </div>
          );
        })}
      </div>
    </AdminModal>
  );
}
