import { APP_VERSION } from "@/lib/constants/app";

export default function Sidebar() {
  return (
    <aside className="border-r bg-white p-4 md:col-span-3">
      <h1 className="text-xl font-semibold">PeacebyPiece v{APP_VERSION}</h1>
      <div className="mt-4 text-sm text-stone-500">작업 리스트</div>
    </aside>
  );
}
