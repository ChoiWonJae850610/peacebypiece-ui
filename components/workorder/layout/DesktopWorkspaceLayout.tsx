import type { ReactNode, RefObject } from "react";

type DesktopWorkspaceLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  sidebar: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
};

export default function DesktopWorkspaceLayout({
  appShellRef,
  sidebar,
  detail,
  sidePanel,
}: DesktopWorkspaceLayoutProps) {
  return (
    <main className="h-screen overflow-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="flex h-full flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
          <aside className="col-span-3 min-h-0 border-r border-stone-200 bg-white">
            {sidebar}
          </aside>

          <section className="col-span-6 min-h-0 overflow-y-auto px-6 py-6">
            {detail}
          </section>

          <aside className="col-span-3 min-h-0 overflow-y-auto border-l border-stone-200 bg-stone-50 px-6 py-6">
            {sidePanel}
          </aside>
        </div>
      </div>
    </main>
  );
}
