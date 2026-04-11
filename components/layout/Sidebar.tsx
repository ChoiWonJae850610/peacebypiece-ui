"use client";

import { APP_VERSION } from "@/lib/constants/app";
import { useI18n } from "@/lib/i18n";

export default function Sidebar() {
  const { i18n } = useI18n();

  return (
    <aside className="border-r bg-white p-4 md:col-span-3">
      <h1 className="text-xl font-semibold">{i18n.common.ui.layout.sidebar.title} v{APP_VERSION}</h1>
      <div className="mt-4 text-sm text-stone-500">{i18n.common.ui.layout.sidebar.workList}</div>
    </aside>
  );
}
