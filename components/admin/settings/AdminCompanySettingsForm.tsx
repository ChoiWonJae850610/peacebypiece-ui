"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { AdminModal } from "@/components/admin/layout/AdminModal";
import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_THEME_OPTIONS,
  getAdminSettingsSaveLabel,
  getAdminSettingsUpdatedAtLabel,
  type AdminSettingSaveState,
} from "@/lib/admin/adminSettings.presentation";
import { runSaveCompanySettingsFlow } from "@/lib/admin/adminSettings.actionFlow";
import type { CompanySettings } from "@/lib/admin/companySettings.types";

type AdminCompanySettingsFormProps = {
  initialSettings: CompanySettings;
  companyName?: string;
};

type SettingsModalKey = "theme" | "language" | "notification" | null;

type SettingsCard = {
  key: "theme" | "language" | "notification";
  title: string;
  summary: string;
  onClick: () => void;
};

function formatCompanyAgeLabel(updatedAt?: string | null) {
  if (!updatedAt) return "운영 정보 준비중";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "운영 정보 준비중";
  return getAdminSettingsUpdatedAtLabel(updatedAt)?.replace("최근 저장 ", "최근 설정 ") ?? "운영 정보 준비중";
}

function ToggleButtonGroup({ label, activeLabel, inactiveLabel, checked, onChange }: { label: string; activeLabel: string; inactiveLabel: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-3">
      <p className="text-sm font-semibold text-stone-950">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${checked ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-stone-200 bg-stone-50 text-stone-500 hover:bg-white"}`}
        >
          {activeLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${!checked ? "border-stone-900 bg-stone-950 text-white" : "border-stone-200 bg-stone-50 text-stone-500 hover:bg-white"}`}
        >
          {inactiveLabel}
        </button>
      </div>
    </div>
  );
}

export default function AdminCompanySettingsForm({ initialSettings, companyName = "샘플 고객사" }: AdminCompanySettingsFormProps) {
  const [draft, setDraft] = useState<CompanySettings>(initialSettings);
  const [saveState, setSaveState] = useState<AdminSettingSaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<SettingsModalKey>(null);

  const saveLabel = getAdminSettingsSaveLabel(saveState);
  const updatedAtLabel = getAdminSettingsUpdatedAtLabel(draft.updatedAt);

  async function handleSave(closeAfterSave = true) {
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
    if (closeAfterSave) setActiveModal(null);
  }

  const cards: SettingsCard[] = [
    { key: "theme", title: "화면 테마", summary: ADMIN_THEME_OPTIONS.find((option) => option.value === draft.ui.themeColor)?.label ?? draft.ui.themeColor, onClick: () => setActiveModal("theme") },
    { key: "language", title: "언어 설정", summary: ADMIN_LANGUAGE_OPTIONS.find((option) => option.value === draft.ui.language)?.label ?? draft.ui.language, onClick: () => setActiveModal("language") },
    {
      key: "notification",
      title: "알림 정책",
      summary: `${[
        draft.notificationPolicy.reviewRequestEnabled,
        draft.notificationPolicy.orderReadyEnabled,
        draft.notificationPolicy.storageWarningEnabled,
        draft.notificationPolicy.purgeResultEnabled,
      ].filter(Boolean).length}개 사용`,
      onClick: () => setActiveModal("notification"),
    },
  ];

  return (
    <>
      <AdminCard>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-stone-950 px-4 py-4 text-white">
            <p className="text-xs font-semibold text-stone-400">고객사</p>
            <p className="mt-2 text-lg font-semibold">{companyName}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold text-stone-500">설정 상태</p>
            <p className="mt-2 text-sm font-semibold text-stone-950">{formatCompanyAgeLabel(draft.updatedAt)}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold text-stone-500">회원</p>
            <p className="mt-2 text-sm font-semibold text-stone-950">관리자 1명 · 디자이너 준비중</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={card.onClick}
              className="flex min-h-[84px] items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:border-stone-300 hover:bg-white"
            >
              <span>
                <span className="block text-sm font-semibold text-stone-950">{card.title}</span>
                <span className="mt-2 block text-xs font-semibold text-stone-500">{card.summary}</span>
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-stone-500 shadow-sm">관리</span>
            </button>
          ))}
        </div>
        {errorMessage ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
        {updatedAtLabel ? <p className="mt-3 text-right text-xs font-semibold text-stone-400">{updatedAtLabel}</p> : null}
      </AdminCard>

      <AdminModal open={activeModal === "theme"} onClose={() => setActiveModal(null)} title="화면 테마" maxWidthClass="md:max-w-2xl">
        <div className="grid gap-3 md:grid-cols-2">
          {ADMIN_THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDraft((current) => ({ ...current, ui: { ...current.ui, themeColor: option.value } }))}
              className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${draft.ui.themeColor === option.value ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
            >
              <span className={`h-9 w-9 rounded-2xl shadow-sm ring-1 ring-white ${option.swatchClassName}`} />
              <span className="min-w-0 flex-1 text-sm font-semibold text-stone-900">{option.label}</span>
              {draft.ui.themeColor === option.value ? <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">현재</span> : null}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-4">
          <button type="button" onClick={() => setActiveModal(null)} className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">취소</button>
          <button type="button" onClick={() => handleSave()} disabled={saveState === "saving"} className="rounded-2xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50">{saveLabel}</button>
        </div>
      </AdminModal>

      <AdminModal open={activeModal === "language"} onClose={() => setActiveModal(null)} title="언어 설정" maxWidthClass="md:max-w-xl">
        <div className="grid gap-3">
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
          <ToggleButtonGroup
            label="컴팩트 모드"
            activeLabel="사용"
            inactiveLabel="미사용"
            checked={draft.ui.compactMode}
            onChange={(checked) => setDraft((current) => ({ ...current, ui: { ...current.ui, compactMode: checked } }))}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-4">
          <button type="button" onClick={() => setActiveModal(null)} className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">취소</button>
          <button type="button" onClick={() => handleSave()} disabled={saveState === "saving"} className="rounded-2xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50">{saveLabel}</button>
        </div>
      </AdminModal>

      <AdminModal open={activeModal === "notification"} onClose={() => setActiveModal(null)} title="알림 정책" maxWidthClass="md:max-w-2xl">
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleButtonGroup label="검토 요청" activeLabel="사용" inactiveLabel="미사용" checked={draft.notificationPolicy.reviewRequestEnabled} onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, reviewRequestEnabled: checked } }))} />
          <ToggleButtonGroup label="발주 준비" activeLabel="사용" inactiveLabel="미사용" checked={draft.notificationPolicy.orderReadyEnabled} onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, orderReadyEnabled: checked } }))} />
          <ToggleButtonGroup label="용량 경고" activeLabel="사용" inactiveLabel="미사용" checked={draft.notificationPolicy.storageWarningEnabled} onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, storageWarningEnabled: checked } }))} />
          <ToggleButtonGroup label="삭제 처리 결과" activeLabel="사용" inactiveLabel="미사용" checked={draft.notificationPolicy.purgeResultEnabled} onChange={(checked) => setDraft((current) => ({ ...current, notificationPolicy: { ...current.notificationPolicy, purgeResultEnabled: checked } }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-4">
          <button type="button" onClick={() => setActiveModal(null)} className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">취소</button>
          <button type="button" onClick={() => handleSave()} disabled={saveState === "saving"} className="rounded-2xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50">{saveLabel}</button>
        </div>
      </AdminModal>
    </>
  );
}
