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
    permissionLabel: t("adminConsole.permissionLabel", "권한"),
  });
}

function AdminWorkspaceCardView({ item, variant = "default" }: { item: AdminWorkspaceCard; variant?: "default" | "hero" }) {
  const translateItem = useWorkspaceCardText();
  const text = translateItem(item);
  const cardClassName =
    variant === "hero"
      ? "rounded-[28px] border border-stone-900 bg-stone-950 p-6 text-white shadow-sm"
      : "h-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm";
  const titleClassName = variant === "hero" ? "text-xl font-semibold" : "text-base font-semibold text-stone-950";
  const descriptionClassName = variant === "hero" ? "mt-3 max-w-2xl text-sm leading-6 text-stone-300" : "mt-3 text-sm leading-6 text-stone-600";
  const permissionClassName = variant === "hero" ? "text-stone-400" : "text-stone-400";

  return (
    <article className={cardClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className={titleClassName}>{text.label}</h2>
          <p className={descriptionClassName}>{text.description}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
          {text.statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {item.href ? (
          <Link
            href={item.href}
            className={
              variant === "hero"
                ? "inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-100"
                : "inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            }
          >
            {text.openLabel}
          </Link>
        ) : (
          <span className="inline-flex rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400">
            {text.preparingLabel}
          </span>
        )}
        <span className={`text-xs font-semibold ${permissionClassName}`}>
          {text.permissionLabel}: {item.permission}
        </span>
      </div>
    </article>
  );
}

export default function AdminConsoleSections() {
  const t = useAdminTranslation();
  const workEntryCard = getAdminWorkspaceWorkEntryCard();
  const managementCards = getAdminWorkspaceManagementCards();
  const futurePermissionCards = getAdminWorkspaceFuturePermissionCards();

  return (
    <>
      <section aria-labelledby="admin-work-entry-title">
        <AdminWorkspaceCardView item={workEntryCard} variant="hero" />
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.managementCards.title", "관리 메뉴")}</h2>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              {t("adminConsole.managementCards.description", "고객관리자 홈은 좌측 패널 없이 필요한 관리 화면으로 바로 이동하는 카드형 구조를 사용합니다.")}
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">
            {t("adminConsole.managementCards.cardCount", "기본 카드 4개 + 멤버관리 후보")}
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {managementCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.futurePermissions.title", "권한 기반 확장 후보")}</h2>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("adminConsole.futurePermissions.description", "단위표준, 외주공정, 생산품유형은 고객관리자 전용 메뉴로 고정하지 않고 멤버 권한에 따라 노출할 후보로 남깁니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {futurePermissionCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}
