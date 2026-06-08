"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { AppButton, AppSheet } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type TabletSplitLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  sidebar: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  topbar?: ReactNode;
  scrollResetKey: string;
};

export default function TabletSplitLayout({
  appShellRef,
  sidebar,
  detail,
  sidePanel,
  topbar,
  scrollResetKey,
}: TabletSplitLayoutProps) {
  const { i18n } = useI18n();
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const sidePanelTitle = `${i18n.workorder.ui.attachmentPanel.title} · ${i18n.workorder.ui.memo.panelTitle}`;

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, left: 0 });
    setSidePanelOpen(false);
  }, [scrollResetKey]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-app-bg)] p-3 text-[var(--pbp-text-primary)] sm:p-4 md:p-6 lg:p-8">
      <div ref={appShellRef} className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5">
        {topbar ? <div className="shrink-0">{topbar}</div> : null}
        <div className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden rounded-[30px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-sm">
          <aside className="col-span-4 min-h-0 border-r border-stone-200 bg-white">
            {sidebar}
          </aside>

          <section
            ref={contentScrollRef}
            className="col-span-8 min-h-0 overflow-y-auto px-4 py-4 pb-[calc(7rem+env(safe-area-inset-bottom))]"
          >
            <div className="grid min-h-full grid-cols-1 gap-4">
              <div>{detail}</div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[calc(33.333333%+2rem)] right-8 z-30 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)]/95 p-3 shadow-[0_-16px_36px_rgba(28,25,23,0.12)] backdrop-blur">
          <AppButton className="w-full" size="lg" onClick={() => setSidePanelOpen(true)}>
            {sidePanelTitle}
          </AppButton>
        </div>

        <AppSheet
          open={sidePanelOpen}
          onOpenChange={setSidePanelOpen}
          title={sidePanelTitle}
          description={i18n.workorder.ui.emptyWorkspace.sideDescription}
          side="right"
          size="lg"
          contentClassName="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          {sidePanel}
        </AppSheet>
      </div>
    </main>
  );
}
