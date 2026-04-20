import type { ReactNode, RefObject } from "react";

type MobileSectionStackProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  topBar: ReactNode;
  drawer: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
};

export default function MobileSectionStack({
  appShellRef,
  topBar,
  drawer,
  detail,
  sidePanel,
}: MobileSectionStackProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="min-h-screen overflow-x-hidden">
        {topBar}
        {drawer}

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-full flex-col gap-3 overflow-x-hidden px-3 py-3 pb-6">
          <section className="min-w-0 overflow-x-hidden">
            {detail}
          </section>

          <aside className="min-w-0 overflow-x-hidden rounded-3xl border border-stone-200 bg-stone-50 px-3 py-3">
            {sidePanel}
          </aside>
        </div>
      </div>
    </main>
  );
}
