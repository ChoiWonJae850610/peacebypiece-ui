"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_RETENTION_DAY_OPTIONS,
  ADMIN_THEME_OPTIONS,
  getAdminSettingsSaveLabel,
  getAdminSettingsUpdatedAtLabel,
  type AdminSettingSaveState,
} from "@/lib/admin/adminSettings.presentation";
import { runSaveCompanySettingsFlow } from "@/lib/admin/adminSettings.actionFlow";
import type { CompanySettings } from "@/lib/admin/companySettings.types";

type AdminCompanySettingsFormProps = {
  initialSettings: CompanySettings;
};

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 rounded border-stone-300 text-stone-900 accent-stone-900"
      />
    </label>
  );
}

export default function AdminCompanySettingsForm({ initialSettings }: AdminCompanySettingsFormProps) {
  const [draft, setDraft] = useState<CompanySettings>(initialSettings);
  const [saveState, setSaveState] = useState<AdminSettingSaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveLabel = getAdminSettingsSaveLabel(saveState);
  const updatedAtLabel = getAdminSettingsUpdatedAtLabel(draft.updatedAt);

  async function handleSave() {
    setSaveState("saving");
    setErrorMessage(null);

    const result = await runSaveCompanySettingsFlow(draft);
    if (!result.ok || !result.settings) {
      setSaveState("error");
      setErrorMessage(result.message || "환경설정을 저장하지 못했습니다.");
      return;
    }

    setDraft(result.settings);
    setSaveState("saved");
  }

  return (
    <div className="grid gap-5">
      <AdminCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">SAVE SETTINGS</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">고객사 환경설정 저장</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">변경한 테마, 언어, 파일 정책, 알림 정책을 company_settings 테이블에 저장합니다. 파일/용량 관리 화면의 빠른 수정도 같은 기준을 사용합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {updatedAtLabel ? <span className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">{updatedAtLabel}</span> : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="rounded-2xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveLabel}
            </button>
          </div>
        </div>
        {errorMessage ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
      </AdminCard>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">THEME</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">테마 색상</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {ADMIN_THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, ui: { ...current.ui, themeColor: option.value } }))}
                className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${draft.ui.themeColor === option.value ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
              >
                <span className={`h-9 w-9 rounded-2xl shadow-sm ring-1 ring-white ${option.swatchClassName}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-900">{option.label}</span>
                  <span className="mt-1 block text-xs text-stone-500">{option.description}</span>
                </span>
                {draft.ui.themeColor === option.value ? <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">현재</span> : null}
              </button>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">LANGUAGE</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">언어 설정</h2>
          <div className="mt-5 grid gap-3">
            {ADMIN_LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, ui: { ...current.ui, language: option.value } }))}
                className={`flex items-center justify-between rounded-3xl border px-4 py-3 text-sm ${draft.ui.language === option.value ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
              >
                <span className="font-semibold text-stone-900">{option.label}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">{draft.ui.language === option.value ? "현재" : "선택"}</span>
              </button>
            ))}
          </div>
          <ToggleRow
            label="컴팩트 모드"
            description="관리자 화면의 여백을 줄여 정보 밀도를 높입니다."
            checked={draft.ui.compactMode}
            onChange={(checked) => setDraft((current) => ({ ...current, ui: { ...current.ui, compactMode: checked } }))}
          />
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">FILE POLICY</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">파일 정책 관리</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">정책 원본은 company_settings입니다. 파일/용량 관리 화면은 이 값을 표시하고 일부 항목만 빠르게 수정합니다.</p>
          <div className="mt-5 grid gap-3">
            <ToggleRow
              label="소프트 삭제"
              description="파일 삭제 시 즉시 물리 삭제하지 않고 휴지통 상태로 보관합니다."
              checked={draft.filePolicy.softDeleteEnabled}
              onChange={(checked) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, softDeleteEnabled: checked } }))}
            />
            <ToggleRow
              label="휴지통 용량 포함"
              description="휴지통 보관 파일도 고객사 사용량에 포함합니다."
              checked={draft.filePolicy.includeTrashInUsage}
              onChange={(checked) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, includeTrashInUsage: checked } }))}
            />
            <label className="grid gap-2 rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-stone-900">삭제 보관 기간</span>
              <select
                value={draft.filePolicy.trashRetentionDays}
                onChange={(event) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, trashRetentionDays: Number(event.target.value) } }))}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400"
              >
                {ADMIN_RETENTION_DAY_OPTIONS.map((days) => (
                  <option key={days} value={days}>{days}일</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-stone-900">기본 용량(GB)</span>
              <input
                type="number"
                min={1}
                value={draft.filePolicy.storageLimitGb}
                onChange={(event) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, storageLimitGb: Number(event.target.value) } }))}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
            </label>
            <label className="grid gap-2 rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-stone-900">용량 경고 기준(%)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={draft.filePolicy.warningThresholdPercent}
                onChange={(event) => setDraft((current) => ({ ...current, filePolicy: { ...current.filePolicy, warningThresholdPercent: Number(event.target.value) } }))}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
            </label>
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">NOTIFICATION POLICY</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">알림 정책</h2>
          <div className="mt-5 grid gap-3">
            <ToggleRow
              label="검토 요청"
              description="디자이너가 검토요청을 보냈을 때 관리자 알림 대상으로 사용합니다."
              checked={draft.notificationPolicy.reviewRequestEnabled}
              onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, reviewRequestEnabled: checked } }))}
            />
            <ToggleRow
              label="발주 준비"
              description="발주 가능 상태가 되었을 때 담당자 알림 대상으로 사용합니다."
              checked={draft.notificationPolicy.orderReadyEnabled}
              onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, orderReadyEnabled: checked } }))}
            />
            <ToggleRow
              label="용량 경고"
              description="파일 사용량이 경고 기준에 도달했을 때 알림 대상으로 사용합니다."
              checked={draft.notificationPolicy.storageWarningEnabled}
              onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, storageWarningEnabled: checked } }))}
            />
            <ToggleRow
              label="삭제 처리 결과"
              description="purge 실행 결과를 관리자 알림 대상으로 사용합니다."
              checked={draft.notificationPolicy.purgeResultEnabled}
              onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, purgeResultEnabled: checked } }))}
            />
          </div>
        </AdminCard>
      </section>
    </div>
  );
}
