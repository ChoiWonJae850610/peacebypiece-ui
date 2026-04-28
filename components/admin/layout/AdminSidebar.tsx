import Link from "next/link";
import type { AdminNavigationItem } from "@/lib/admin/adminDashboard.presentation";

type AdminSidebarProps = {
  companyName: string;
  appVersion: string;
  navigationItems: AdminNavigationItem[];
};

type SidebarIconProps = {
  type: string;
  active?: boolean;
};

function SidebarIcon({ type, active }: SidebarIconProps) {
  const strokeClassName = active ? "stroke-stone-950" : "stroke-stone-500";
  const fillClassName = active ? "fill-stone-950" : "fill-stone-500";
  const baseProps = {
    viewBox: "0 0 24 24",
    className: `h-4 w-4 ${strokeClassName}`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (type) {
    case "dashboard":
      return (
        <svg {...baseProps}>
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6.5 10.5V19h11v-8.5" />
          <path d="M10 19v-5h4v5" />
        </svg>
      );
    case "workorder":
      return (
        <svg {...baseProps}>
          <path d="M8 4.5h7l3 3V19.5H6V4.5h2Z" />
          <path d="M14.5 4.5V8H18" />
          <path d="M9 12h6" />
          <path d="M9 15.5h5" />
        </svg>
      );
    case "partners":
      return (
        <svg {...baseProps}>
          <path d="M4.5 20V7.5h7V20" />
          <path d="M12.5 20V4.5h7V20" />
          <path d="M7 10h2" />
          <path d="M7 13h2" />
          <path d="M15 8h2" />
          <path d="M15 11h2" />
          <path d="M15 14h2" />
        </svg>
      );
    case "storage":
      return (
        <svg {...baseProps}>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
          <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </svg>
      );
    case "standards":
      return (
        <svg {...baseProps}>
          <path d="M5 5h14" />
          <path d="M5 10h14" />
          <path d="M5 15h14" />
          <path d="M8 5v14" />
          <path d="M16 5v14" />
        </svg>
      );
    case "statistics":
      return (
        <svg {...baseProps}>
          <path d="M5 19V5" />
          <path d="M5 19h14" />
          <path d="M8.5 16v-4" />
          <path d="M12 16V8" />
          <path d="M15.5 16v-6" />
        </svg>
      );
    case "history":
      return (
        <svg {...baseProps}>
          <path d="M5 12a7 7 0 1 0 2-4.9" />
          <path d="M5 5v4h4" />
          <path d="M12 8.5V12l2.5 1.5" />
        </svg>
      );
    case "settings":
      return (
        <svg {...baseProps}>
          <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
          <path d="M19 12a6.9 6.9 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.3 7.3 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7.3 7.3 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a6.9 6.9 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.3 7.3 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7.3 7.3 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </svg>
      );
    default:
      return <span className={`text-sm ${fillClassName}`}>{type}</span>;
  }
}

export default function AdminSidebar({ companyName, appVersion, navigationItems }: AdminSidebarProps) {
  const showDbStatus = process.env.NODE_ENV !== "production";

  return (
    <aside className="flex min-w-0 flex-col rounded-[32px] border border-stone-200 bg-white p-4 shadow-sm lg:h-full lg:w-72 lg:shrink-0">
      <div className="rounded-[24px] bg-stone-950 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{companyName}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-stone-300">v{appVersion}</span>
        </div>
        {showDbStatus ? (
          <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" aria-hidden="true" />
            DB 연결
          </div>
        ) : null}
      </div>

      <nav className="mt-5 grid min-h-0 gap-2 overflow-y-auto" aria-label="관리자 메뉴">
        {navigationItems.map((item) => {
          const itemClassName = `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
            item.active ? "bg-stone-100 text-stone-950" : "text-stone-600 hover:bg-stone-50 hover:text-stone-950"
          }`;

          const content = (
            <>
              <span className={["flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm ring-1 transition", item.active ? "bg-stone-950 ring-stone-950 [&_svg]:stroke-white" : "bg-white ring-stone-200"].join(" ") }>
                <SidebarIcon type={item.icon} active={item.active} />
              </span>
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
