"use client";

import Link from "next/link";
import { type ReactNode, useRef } from "react";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
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

const i18n = getI18n();
const system = i18n.system;

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
              </div>
            </div>
          </div>
        </header>

        <CategoryRulesManager ref={managerRef} text={system.categoryRulePage.editor} />
      </div>
    </main>
  );
}
