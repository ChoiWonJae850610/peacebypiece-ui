"use client";

import { useEffect, useMemo, useState } from "react";
import StatusToggle from "@/components/common/StatusToggle";
import { AdminModal, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import {
  buildAdminStorageStatusPreview,
  buildAdminStorageThresholdPolicy,
  normalizeAdminFilePolicyDraft,
} from "@/lib/admin/settings/presentation";
import { runSaveCompanySettingsFlow } from "@/lib/admin/settings/actionFlow";
import { COMPANY_FILE_TRASH_RETENTION_DAYS, buildDefaultCompanySettings } from "@/lib/admin/settings/companyDefaults";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminFilePolicySettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

function ToggleButtonGroup({ label, description, activeLabel, inactiveLabel, checked, onChange }: { label: string; description: string; activeLabel: string; inactiveLabel: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-950">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">{description}</p>
          <p className="mt-1 text-xs font-semibold text-stone-700">{checked ? activeLabel : inactiveLabel}</p>
        </div>
        <StatusToggle checked={checked} onChange={onChange} srLabel={label} size="sm" />
      </div>
    </div>
  );
}

export default function AdminFilePolicySettingsModal({ open, onClose }: AdminFilePolicySettingsModalProps) {
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
        if (payload.settings) setDraft({ ...payload.settings, filePolicy: normalizeAdminFilePolicyDraft(payload.settings.filePolicy) });
        else if (payload.message) setErrorMessage(payload.message);
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : t("standards.filePolicy.loadFailed", "파일 정책을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, t]);

  const storageStatusPreview = useMemo(() => buildAdminStorageStatusPreview(draft.filePolicy), [draft.filePolicy]);
  const storageThresholdPolicy = useMemo(() => buildAdminStorageThresholdPolicy(draft.filePolicy), [draft.filePolicy]);

  function handleReset() {
    if (saving || loading) return;
    setDraft((current) => ({
      ...current,
      filePolicy: { ...defaultSettings.filePolicy },
    }));
  }

  async function handleSave() {
    if (saving || loading) return;
    setSaving(true);
    setErrorMessage(null);
    const normalizedDraft = { ...draft, filePolicy: normalizeAdminFilePolicyDraft(draft.filePolicy) };
    const result = await runSaveCompanySettingsFlow(normalizedDraft);
    setSaving(false);
    if (!result.ok || !result.settings) {
      setErrorMessage(result.message || t("standards.filePolicy.saveFailed", "파일 정책을 저장하지 못했습니다."));
      return;
    }
    setDraft({ ...result.settings, filePolicy: normalizeAdminFilePolicyDraft(result.settings.filePolicy) });
    onClose();
  }

  return (
    <AdminModal
      open={open}
      onClose={() => {
        if (saving || loading) return;
        onClose();
      }}
      title={t("standards.filePolicy.title", "파일 정책 관리")}
      maxWidthClass="md:max-w-3xl"
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
      <div className="grid min-h-[232px] gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        {errorMessage ? <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{errorMessage}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-sm font-semibold text-stone-950">{t("standards.filePolicy.deleteMode", "삭제 방식")}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">
              {t("standards.filePolicy.fixedTrashPolicyDescription", "삭제된 파일은 휴지통으로 이동하며 30일 동안 복원할 수 있습니다.")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">{t("standards.filePolicy.softDelete", "휴지통")}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                {COMPANY_FILE_TRASH_RETENTION_DAYS}{t("standards.filePolicy.daySuffix", "일")} {t("standards.filePolicy.fixedRetention", "고정")}
              </span>
            </div>
          </div>
          <ToggleButtonGroup
            label={t("standards.filePolicy.includeTrashInUsage", "휴지통 용량 포함")}
            description={t("standards.filePolicy.includeTrashDescription", "실제 삭제 전 파일을 사용량에 포함할지 정합니다.")}
            activeLabel={t("standards.filePolicy.includeTrashActive", "포함")}
            inactiveLabel={t("standards.filePolicy.includeTrashInactive", "제외")}
            checked={draft.filePolicy.includeTrashInUsage}
            onChange={(includeTrashInUsage) => {
              if (saving || loading) return;
              setDraft((current) => ({ ...current, filePolicy: normalizeAdminFilePolicyDraft({ ...current.filePolicy, includeTrashInUsage }) }));
            }}
          />
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-950">{t("standards.filePolicy.retentionDays", "파일 보관 기간")}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
            {t("standards.filePolicy.fixedRetentionDescription", "고객사는 보관 기간을 변경할 수 없습니다. 휴지통 파일은 삭제일로부터 30일이 지나면 시스템관리자 R2 삭제 후보가 됩니다.")}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 rounded-3xl border border-stone-200 bg-stone-50 p-3 text-sm">
            <span className="font-semibold text-stone-900">{t("standards.filePolicy.storageLimit", "기본 용량 한도(GB)")}</span>
            <input
              type="number"
              min={1}
              max={999}
              value={draft.filePolicy.storageLimitGb}
              onChange={(event) => {
                if (saving || loading) return;
                setDraft((current) => ({ ...current, filePolicy: normalizeAdminFilePolicyDraft({ ...current.filePolicy, storageLimitGb: Number(event.target.value) }) }));
              }}
              disabled={saving || loading}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
          </label>
          <label className="grid gap-2 rounded-3xl border border-stone-200 bg-stone-50 p-3 text-sm">
            <span className="font-semibold text-stone-900">{t("standards.filePolicy.warningThreshold", "용량 주의 기준(%)")}</span>
            <input
              type="number"
              min={1}
              max={99}
              value={draft.filePolicy.warningThresholdPercent}
              onChange={(event) => {
                if (saving || loading) return;
                setDraft((current) => ({ ...current, filePolicy: normalizeAdminFilePolicyDraft({ ...current.filePolicy, warningThresholdPercent: Number(event.target.value) }) }));
              }}
              disabled={saving || loading}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
            <span className="text-xs font-semibold leading-5 text-stone-500">
              {t("standards.filePolicy.dangerThresholdDescription", "위험 기준은 주의 기준보다 10% 높게 계산됩니다.")} {storageThresholdPolicy.dangerThresholdPercent}%
            </span>
          </label>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-3">
          <p className="text-sm font-semibold text-stone-950">{t("standards.filePolicy.storageStatus", "용량 상태")}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {storageStatusPreview.map((item) => (
              <div key={item.tone} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone === "danger" ? "bg-red-100 text-red-700" : item.tone === "caution" ? "bg-amber-100 text-amber-900" : "bg-stone-950 text-white"}`}>{t(`standards.filePolicy.storageStatusLabels.${item.tone}`, item.label)}</span>
                <p className="mt-2 text-xs font-semibold leading-5 text-stone-500">
                  {t(
                    `standards.filePolicy.storageStatusDescriptions.${item.tone}`,
                    item.description,
                    item.tone === "normal"
                      ? { caution: storageThresholdPolicy.cautionThresholdPercent }
                      : item.tone === "caution"
                        ? { caution: storageThresholdPolicy.cautionThresholdPercent, danger: storageThresholdPolicy.dangerThresholdPercent }
                        : { danger: storageThresholdPolicy.dangerThresholdPercent },
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
