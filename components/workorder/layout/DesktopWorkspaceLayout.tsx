import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type DesktopWorkspaceLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  sidebar: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  scrollResetKey: string;
};

export default function DesktopWorkspaceLayout({
  appShellRef,
  sidebar,
  detail,
  sidePanel,
  scrollResetKey,
}: DesktopWorkspaceLayoutProps) {
  const detailScrollRef = useRef<HTMLElement | null>(null);
  const sidePanelScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    detailScrollRef.current?.scrollTo({ top: 0, left: 0 });
    sidePanelScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [scrollResetKey]);
  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-app-bg)] p-4 pbp-text-primary md:p-5 lg:p-6">
      <div ref={appShellRef} className="mx-auto flex h-full w-full max-w-[1560px] gap-3 overflow-hidden xl:gap-4">
        <aside className="flex min-h-0 w-[280px] shrink-0 overflow-hidden rounded-[30px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-sm xl:w-[292px]">
          {sidebar}
        </aside>

        <section ref={detailScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[30px] border border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_92%,transparent)] px-4 py-4 pb-8 shadow-sm backdrop-blur [scrollbar-gutter:stable] xl:px-5 xl:py-5 xl:pb-10">
          <div className="mx-auto min-h-full w-full max-w-[900px]">
            {detail}
          </div>
        </section>

        <aside ref={sidePanelScrollRef} className="min-h-0 w-[326px] shrink-0 overflow-y-auto overscroll-contain rounded-[30px] border border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_86%,transparent)] px-3.5 py-4 pb-8 shadow-sm backdrop-blur [scrollbar-gutter:stable] xl:w-[344px] xl:px-4 xl:pb-10">
          {sidePanel}
        </aside>
      </div>
    </main>
  );
}
