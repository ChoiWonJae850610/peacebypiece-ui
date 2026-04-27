import Link from "next/link";
import AdminWorkspaceTools from "@/components/admin/AdminWorkspaceTools";

type AdminTopbarProps = {
  title: string;
  description: string;
  appVersion: string;
};

export default function AdminTopbar({ title, description, appVersion }: AdminTopbarProps) {
  return (
    <header className="rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">ADMIN DASHBOARD</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{description}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
          <span className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600">v{appVersion}</span>
          <Link
            href="/worker"
            className="inline-flex shrink-0 items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            작지 화면
          </Link>
          <AdminWorkspaceTools />
        </div>
      </div>
    </header>
  );
}
