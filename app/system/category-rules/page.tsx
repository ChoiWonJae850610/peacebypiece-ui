"use client";

import { useRef } from "react";
import { APP_VERSION } from "@/lib/constants/app";
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { getI18n } from "@/lib/i18n";
import { getCategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import CategoryRulesManager, { type CategoryRulesManagerHandle } from "./CategoryRulesManager";


function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13V10.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v5h5" />
      <path d="M20 12a8 8 0 1 1-2.35-5.65L20 9" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.3 1.3a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.8a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1.3-1.3a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.8a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.3-1.3a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.8a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.3 1.3a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1v1.8a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

const i18n = getI18n();
const system = i18n.system;
const categoryRuleText = getCategoryRulesManagerText();

export default function SystemCategoryRulesPage() {
  const managerRef = useRef<CategoryRulesManagerHandle | null>(null);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{system.eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{system.categoryRulePage.title}</h1>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <AdminStatusBadge tone="neutral">{system.versionLabel} v{APP_VERSION}</AdminStatusBadge>
              <div className="flex flex-wrap gap-2">
                <AdminLinkButton href="/system" aria-label={system.categoryRulePage.backToSystem} title={system.categoryRulePage.backToSystem} className="h-11 w-11 px-0">
                  <span className="sr-only">{system.categoryRulePage.backToSystem}</span>
                  <HomeIcon />
                </AdminLinkButton>
                <AdminButton onClick={() => managerRef.current?.reset()} aria-label={system.categoryRulePage.editor.resetRules} title={system.categoryRulePage.editor.resetRules} className="h-11 w-11 px-0">
                  <span className="sr-only">{system.categoryRulePage.editor.resetRules}</span>
                  <ResetIcon />
                </AdminButton>
                <AdminButton
                  onClick={() => managerRef.current?.save()}
                  aria-label={system.categoryRulePage.editor.saveRules}
                  title={system.categoryRulePage.editor.saveRules}
                  variant="primary"
                  className="h-11 w-11 px-0"
                >
                  <span className="sr-only">{system.categoryRulePage.editor.saveRules}</span>
                  <SaveIcon />
                </AdminButton>
                <AdminButton onClick={() => managerRef.current?.openCategoryValues()} aria-label={system.categoryRulePage.editor.categoryValuesButton} title={system.categoryRulePage.editor.categoryValuesButton} className="h-11 w-11 px-0">
                  <span className="sr-only">{system.categoryRulePage.editor.categoryValuesButton}</span>
                  <SettingsIcon />
                </AdminButton>
              </div>
            </div>
          </div>
        </header>

        <CategoryRulesManager ref={managerRef} text={categoryRuleText} />
      </div>
    </main>
  );
}
