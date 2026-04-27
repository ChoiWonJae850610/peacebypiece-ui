import Link from "next/link";
import type { AdminNavigationItem } from "@/lib/admin/adminDashboard.presentation";

type AdminSidebarProps = {
  companyName: string;
  navigationItems: AdminNavigationItem[];
};

export default function AdminSidebar({ companyName, navigationItems }: AdminSidebarProps) {
  return (
    <aside className="min-w-0 rounded-[32px] border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:w-72 lg:shrink-0">
      <div className="rounded-[24px] bg-stone-950 p-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">CUSTOMER NAME</p>
        <p className="mt-2 truncate text-lg font-semibold">{companyName}</p>
        <p className="mt-3 text-xs leading-5 text-stone-300">관리자 운영 기준 화면</p>
      </div>

      <nav className="mt-5 grid gap-2" aria-label="관리자 메뉴">
        {navigationItems.map((item) => {
          const itemClassName = `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
            item.active ? "bg-stone-100 text-stone-950" : "text-stone-600 hover:bg-stone-50 hover:text-stone-950"
          }`;

          const content = (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-base shadow-sm ring-1 ring-stone-200">{item.icon}</span>
              <span className="min-w-0 truncate">{item.label}</span>
            </>
          );

          if (!item.href) {
            return (
              <div key={item.label} className={`${itemClassName} opacity-60`}>
                {content}
              </div>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={itemClassName}>
              {content}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
