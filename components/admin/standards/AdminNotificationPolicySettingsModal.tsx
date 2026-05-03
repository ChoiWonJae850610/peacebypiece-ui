"use client";

import { useEffect, useState } from "react";
import AdminUsageToggle from "@/components/admin/common/AdminUsageToggle";
import { AdminModal, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import { runSaveCompanySettingsFlow } from "@/lib/admin/settings/actionFlow";
import { buildDefaultCompanySettings } from "@/lib/admin/settings/companyDefaults";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminNotificationPolicySettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const POLICY_ITEMS: Array<{
  key: keyof CompanySettings["notificationPolicy"];
  labelPath: string;
  fallback: string;
}> = [
  { key: "reviewRequestEnabled", labelPath: "standards.notificationPolicy.items.reviewRequestEnabled", fallback: "검토 요청" },
  { key: "orderReadyEnabled", labelPath: "standards.notificationPolicy.items.orderReadyEnabled", fallback: "발주 준비" },
  { key: "storageWarningEnabled", labelPath: "standards.notificationPolicy.items.storageWarningEnabled", fallback: "용량 경고" },
  { key: "purgeResultEnabled", labelPath: "standards.notificationPolicy.items.purgeResultEnabled", fallback: "삭제 결과" },
];

export default function AdminNotificationPolicySettingsModal({ open, onClose }: AdminNotificationPolicySettingsModalProps) {
  const t = useAdminTranslation();
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
        setErrorMessage(error instanceof Error ? error.message : t("standards.notificationPolicy.loadFailed", "알림 정책을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, t]);

  function handleReset() {
    if (saving || loading) return;
    setDraft((current) => ({
      ...current,
      notificationPolicy: { ...defaultSettings.notificationPolicy },
    }));
  }

  async function handleSave() {
    if (saving || loading) return;
    setSaving(true);
    setErrorMessage(null);
    const result = await runSaveCompanySettingsFlow(draft);
    setSaving(false);
    if (!result.ok || !result.settings) {
      setErrorMessage(result.message || t("standards.notificationPolicy.saveFailed", "알림 정책을 저장하지 못했습니다."));
      return;
    }
    setDraft(result.settings);
    onClose();
  }

  return (
    <AdminModal
      open={open}
      onClose={() => {
        if (saving || loading) return;
        onClose();
      }}
      title={t("standards.notificationPolicy.title", "알림 정책")}
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={handleReset} disabled={saving || loading} className={adminModalSecondaryButtonClassName}>
            {t("standards.common.resetDefaults", "기본값 복원")}
          </button>
          <button type="button" onClick={handleSave} disabled={saving || loading} className={adminModalPrimaryButtonClassName}>
            {saving ? t("standards.common.saving", "저장 중") : t("standards.common.save", "저장")}
          </button>
        </div>
      }
    >
      <div className="grid min-h-[252px] content-start gap-2 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        {errorMessage ? <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{errorMessage}</p> : null}
        {POLICY_ITEMS.map((item) => {
          const checked = draft.notificationPolicy[item.key];
          return (
            <AdminUsageToggle
              key={item.key}
              label={t(item.labelPath, item.fallback)}
              checked={checked}
              activeLabel={t("standards.common.active", "사용")}
              inactiveLabel={t("standards.common.inactive", "미사용")}
              disabled={saving || loading}
              className="bg-stone-50/70"
              onChange={(nextValue) => {
                if (saving || loading) return;
                setDraft((current) => ({
                  ...current,
                  notificationPolicy: {
                    ...current.notificationPolicy,
                    [item.key]: nextValue,
                  },
                }));
              }}
            />
          );
        })}
      </div>
    </AdminModal>
  );
}
