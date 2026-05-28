"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

import { AppButton, AppSheet } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type MobileSectionStackProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  topBar: ReactNode;
  drawer: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  scrollResetKey: string;
};

export default function MobileSectionStack({
  appShellRef,
  topBar,
  drawer,
  detail,
  sidePanel,
  scrollResetKey,
}: MobileSectionStackProps) {
  const { i18n } = useI18n();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const sidePanelTitle = `${i18n.workorder.ui.attachmentPanel.title} · ${i18n.workorder.ui.memo.panelTitle}`;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    setSidePanelOpen(false);
  }, [scrollResetKey]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="min-h-screen overflow-x-hidden">
        {topBar}
        {drawer}

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-full flex-col gap-2.5 overflow-x-hidden px-2.5 py-2.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:gap-3 sm:px-3 sm:py-3 sm:pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
          <section className="min-w-0 overflow-x-hidden">
            {detail}
          </section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--pbp-border)] bg-[var(--pbp-surface)]/95 px-3 py-3 shadow-[0_-16px_36px_rgba(28,25,23,0.12)] backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <AppButton className="w-full" size="lg" onClick={() => setSidePanelOpen(true)}>
            {sidePanelTitle}
          </AppButton>
        </div>

        <AppSheet
          open={sidePanelOpen}
          onOpenChange={setSidePanelOpen}
          title={sidePanelTitle}
          description={i18n.workorder.ui.emptyWorkspace.sideDescription}
          side="bottom"
          size="full"
          contentClassName="px-3 py-3"
        >
          {sidePanel}
        </AppSheet>
      </div>
    </main>
  );
}
