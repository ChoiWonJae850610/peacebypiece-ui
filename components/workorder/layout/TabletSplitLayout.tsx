import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type TabletSplitLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  sidebar: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  scrollResetKey: string;
};

export default function TabletSplitLayout({
  appShellRef,
  sidebar,
  detail,
  sidePanel,
  scrollResetKey,
}: TabletSplitLayoutProps) {
  const contentScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [scrollResetKey]);
  return (
    <main className="h-screen overflow-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="flex h-full flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
          <aside className="col-span-4 min-h-0 border-r border-stone-200 bg-white">
            {sidebar}
          </aside>

          <section ref={contentScrollRef} className="col-span-8 min-h-0 overflow-y-auto px-4 py-4">
            <div className="grid min-h-full grid-cols-1 gap-4">
              <div>{detail}</div>
              <aside className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                {sidePanel}
              </aside>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
