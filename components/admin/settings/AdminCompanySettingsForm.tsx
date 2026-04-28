"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_THEME_OPTIONS,
  getAdminSettingsUpdatedAtLabel,
  type AdminSettingSaveState,
} from "@/lib/admin/adminSettings.presentation";
import { runSaveCompanySettingsFlow } from "@/lib/admin/adminSettings.actionFlow";
import type { CompanySettings } from "@/lib/admin/companySettings.types";

type AdminCompanySettingsFormProps = {
  initialSettings: CompanySettings;
  companyName?: string;
};

function formatCompanyDateLabel(updatedAt?: string | null) {
  if (!updatedAt) return { joinedAt: "가입일 준비중", age: "D+0", updatedAt: "최근 설정 준비중" };
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return { joinedAt: "가입일 준비중", age: "D+0", updatedAt: "최근 설정 준비중" };
  const start = new Date(parsed);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const joinedAt = `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${String(parsed.getDate()).padStart(2, "0")}`;

  return {
    joinedAt,
    age: `D+${ageDays}`,
    updatedAt: getAdminSettingsUpdatedAtLabel(updatedAt)?.replace("최근 저장 ", "최근 설정 ") ?? "최근 설정 준비중",
  };
}

function SaveStateBadge({ saveState }: { saveState: AdminSettingSaveState }) {
  if (saveState === "saving") return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">저장 중</span>;
  if (saveState === "saved") return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">저장됨</span>;
  if (saveState === "error") return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">저장 실패</span>;
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">설정</span>;
}

export default function AdminCompanySettingsForm({ initialSettings, companyName = "샘플 고객사" }: AdminCompanySettingsFormProps) {
  const [draft, setDraft] = useState<CompanySettings>(initialSettings);
  const [saveState, setSaveState] = useState<AdminSettingSaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function saveNextSettings(nextSettings: CompanySettings) {
    setDraft(nextSettings);
    setSaveState("saving");
    setErrorMessage(null);

    const result = await runSaveCompanySettingsFlow(nextSettings);
    if (!result.ok || !result.settings) {
      setSaveState("error");
      setErrorMessage(result.message || "환경설정을 저장하지 못했습니다.");
      return;
    }

    setDraft(result.settings);
    setSaveState("saved");
  }

  const currentTheme = ADMIN_THEME_OPTIONS.find((option) => option.value === draft.ui.themeColor) ?? ADMIN_THEME_OPTIONS[0];
  const currentLanguage = ADMIN_LANGUAGE_OPTIONS.find((option) => option.value === draft.ui.language) ?? ADMIN_LANGUAGE_OPTIONS[0];
  const companyDate = formatCompanyDateLabel(draft.updatedAt);

  return (
    <AdminCard className="shrink-0">
      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[28px] bg-stone-950 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{companyName}</h2>
              <p className="mt-2 text-xs font-semibold text-stone-400">{companyDate.updatedAt}</p>
            </div>
            <SaveStateBadge saveState={saveState} />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-stone-400">운영 상태</p>
              <p className="mt-2 text-sm font-semibold text-white">DB 연결</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-stone-400">가입일</p>
              <p className="mt-2 text-sm font-semibold text-white">{companyDate.joinedAt}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-stone-400">사용 기간</p>
              <p className="mt-2 text-sm font-semibold text-white">{companyDate.age}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-stone-400">회원</p>
              <p className="mt-2 text-sm font-semibold text-white">관리자 1명</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-950">화면 테마</p>
                <p className="mt-1 text-xs font-semibold text-stone-500">현재 {currentTheme.label}</p>
              </div>
              <span className={`h-8 w-8 rounded-2xl shadow-sm ring-1 ring-white ${currentTheme.swatchClassName}`} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ADMIN_THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => saveNextSettings({ ...draft, ui: { ...draft.ui, themeColor: option.value } })}
                  className={`h-9 rounded-2xl border transition ${draft.ui.themeColor === option.value ? "border-stone-950 bg-white" : "border-stone-200 bg-white/70 hover:bg-white"}`}
                >
                  <span className={`mx-auto block h-5 w-5 rounded-full ${option.swatchClassName}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-4">
            <div>
              <p className="text-sm font-semibold text-stone-950">언어 설정</p>
              <p className="mt-1 text-xs font-semibold text-stone-500">현재 {currentLanguage.label}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {ADMIN_LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => saveNextSettings({ ...draft, ui: { ...draft.ui, language: option.value } })}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${draft.ui.language === option.value ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
      {errorMessage ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
    </AdminCard>
  );
}
