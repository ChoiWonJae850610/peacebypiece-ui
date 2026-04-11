import { getI18n } from "@/lib/i18n";

export default function RightPanel() {
  const i18n = getI18n();
  return (
    <aside className="md:col-span-3 bg-stone-50 border-l p-4">
      <div className="text-sm">{i18n.common.ui.layout.rightPanel}</div>
    </aside>
  );
}
