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
    <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#eef2ff_100%)] p-4 text-stone-900 md:p-5 lg:p-6">
      <div ref={appShellRef} className="mx-auto flex h-full w-full max-w-[1560px] gap-3 overflow-hidden xl:gap-4">
        <aside className="flex min-h-0 w-[280px] shrink-0 overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm xl:w-[292px]">
          {sidebar}
        </aside>

        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[30px] border border-stone-200 bg-white/90 px-4 py-4 pb-8 shadow-sm backdrop-blur [scrollbar-gutter:stable] xl:px-5 xl:py-5 xl:pb-10">
          <div className="mx-auto min-h-full w-full max-w-[900px]">
            {detail}
          </div>
        </section>

        <aside className="min-h-0 w-[326px] shrink-0 overflow-y-auto overscroll-contain rounded-[30px] border border-stone-200 bg-white/80 px-3.5 py-4 pb-8 shadow-sm backdrop-blur [scrollbar-gutter:stable] xl:w-[344px] xl:px-4 xl:pb-10">
          {sidePanel}
        </aside>
      </div>
    </main>
  );
}
