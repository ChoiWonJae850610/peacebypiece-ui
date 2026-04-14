"use client";

import Link from "next/link";
import { type ReactNode, useRef } from "react";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import { getCategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import CategoryRulesManager, { type CategoryRulesManagerHandle } from "./CategoryRulesManager";


function HeaderIconButton({
  href,
  onClick,
  label,
  variant = "secondary",
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  variant?: "secondary" | "primary";
  children: ReactNode;
}) {
  const className = [
    "inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
    variant === "primary"
      ? "border-stone-900 bg-stone-900 text-white hover:bg-stone-800"
      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        <span className="sr-only">{label}</span>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}

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
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{system.versionLabel} v{APP_VERSION}</span>
              <div className="flex flex-wrap gap-2">
                <HeaderIconButton href="/system" label={system.categoryRulePage.backToSystem}>
                  <HomeIcon />
                </HeaderIconButton>
                <HeaderIconButton onClick={() => managerRef.current?.reset()} label={system.categoryRulePage.editor.resetRules}>
                  <ResetIcon />
                </HeaderIconButton>
                <HeaderIconButton
                  onClick={() => managerRef.current?.save()}
                  label={system.categoryRulePage.editor.saveRules}
                  variant="primary"
                >
                  <SaveIcon />
                </HeaderIconButton>
                <HeaderIconButton onClick={() => managerRef.current?.openCategoryValues()} label={system.categoryRulePage.editor.categoryValuesButton}>
                  <SettingsIcon />
                </HeaderIconButton>
              </div>
            </div>
          </div>
        </header>

        <CategoryRulesManager ref={managerRef} text={categoryRuleText} />
      </div>
    </main>
  );
}
