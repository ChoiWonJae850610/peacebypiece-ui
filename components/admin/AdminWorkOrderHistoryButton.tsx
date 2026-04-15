import Link from "next/link";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();

export default function AdminWorkOrderHistoryButton() {
  return (
    <Link
      href="/admin/history"
      className="inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
    >
      {i18n.common.viewWorkOrderHistory}
    </Link>
  );
}
