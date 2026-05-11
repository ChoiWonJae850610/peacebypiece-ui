"use client";

import Link from "next/link";
import {
  getAdminWorkspaceFuturePermissionCards,
  getAdminWorkspaceManagementCards,
  getAdminWorkspaceWorkEntryCard,
  type AdminWorkspaceCard,
  type AdminWorkspaceCardStatus,
} from "@/lib/admin/adminWorkspaceCards";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function getStatusClassName(status: AdminWorkspaceCardStatus) {
  if (status === "available") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-stone-200 bg-stone-100 text-stone-500";
}

function useWorkspaceCardText() {
  const t = useAdminTranslation();

  return (item: AdminWorkspaceCard) => ({
    label: t(`adminConsole.links.${item.id}.label`, item.label),
    description: t(`adminConsole.links.${item.id}.description`, item.description),
    statusLabel: t(`adminConsole.statuses.${item.status}`, item.statusLabel),
    openLabel: t("adminConsole.actions.open", "화면 열기"),
    preparingLabel: t("adminConsole.statuses.planned", "준비중"),
  });
}

function AdminWorkspaceCardView({ item }: { item: AdminWorkspaceCard }) {
  const translateItem = useWorkspaceCardText();
  const text = translateItem(item);

  const content = (
    <article className="h-full rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-stone-950">{text.label}</h2>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
              {text.statusLabel}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{text.description}</p>
        </div>

        {item.href ? (
          <span className="inline-flex w-fit rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white">
            {text.openLabel}
          </span>
        ) : (
          <span className="inline-flex w-fit rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400">
            {text.preparingLabel}
          </span>
        )}
      </div>
    </article>
  );

  if (!item.href) return content;

  return (
    <Link href={item.href} className="block h-full min-w-0">
      {content}
    </Link>
  );
}

export default function AdminConsoleSections() {
  const t = useAdminTranslation();
  const managementCards = [getAdminWorkspaceWorkEntryCard(), ...getAdminWorkspaceManagementCards()];
  const futurePermissionCards = getAdminWorkspaceFuturePermissionCards();

  return (
    <>
      <section className="rounded-3xl border border-stone-200 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.managementCards.title", "주요 메뉴")}</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {managementCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.futurePermissions.title", "기준정보")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {futurePermissionCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}
