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
    <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#eef2ff_100%)] p-5 text-stone-900 md:p-6 lg:p-8">
      <div ref={appShellRef} className="mx-auto flex h-full w-full max-w-[1500px] gap-4 overflow-hidden xl:gap-5">
        <aside className="flex min-h-0 w-[268px] shrink-0 overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm">
          {sidebar}
        </aside>

        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[30px] border border-stone-200 bg-white/90 px-5 py-5 shadow-sm backdrop-blur xl:px-6">
          <div className="mx-auto min-h-full w-full max-w-[860px]">
            {detail}
          </div>
        </section>

        <aside className="min-h-0 w-[348px] shrink-0 overflow-y-auto overscroll-contain rounded-[30px] border border-stone-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur xl:w-[360px] xl:px-5 xl:py-5">
          {sidePanel}
        </aside>
      </div>
    </main>
  );
}
