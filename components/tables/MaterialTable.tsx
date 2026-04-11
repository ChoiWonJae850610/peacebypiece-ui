import { getI18n } from "@/lib/i18n";

export default function MaterialTable() {
  const i18n = getI18n();
  const common = i18n.common.ui.common;
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-[600px] text-sm">
        <tbody>
          <tr><td>{i18n.workorder.presentation.materials.title}</td><td>{common.sample}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
