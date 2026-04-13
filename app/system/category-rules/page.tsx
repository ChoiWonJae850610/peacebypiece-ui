"use client";

import Link from "next/link";
import { useRef } from "react";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import CategoryRulesManager, { type CategoryRulesManagerHandle } from "./CategoryRulesManager";

const i18n = getI18n();
const system = i18n.system;

export default function SystemCategoryRulesPage() {
  const managerRef = useRef<CategoryRulesManagerHandle | null>(null);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{system.eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{system.categoryRulePage.title}</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600 md:text-base">{system.categoryRulePage.description}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{system.versionLabel} v{APP_VERSION}</span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/system"
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  {system.categoryRulePage.backToSystem}
                </Link>
                <button
                  type="button"
                  onClick={() => managerRef.current?.reset()}
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  {system.categoryRulePage.editor.resetRules}
                </button>
                <button
                  type="button"
                  onClick={() => managerRef.current?.save()}
                  className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  {system.categoryRulePage.editor.saveRules}
                </button>
              </div>
            </div>
          </div>
        </header>

        <CategoryRulesManager ref={managerRef} text={system.categoryRulePage.editor} />
      </div>
    </main>
  );
}
