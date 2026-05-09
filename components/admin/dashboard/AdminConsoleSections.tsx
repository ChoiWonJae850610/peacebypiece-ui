"use client";

import Link from "next/link";
import {
  ADMIN_CONSOLE_API_LINKS,
  ADMIN_CONSOLE_POLICY_NOTES,
  ADMIN_CONSOLE_PRIMARY_LINKS,
  ADMIN_CONSOLE_SECONDARY_LINKS,
  type AdminConsoleLinkItem,
  type AdminConsoleLinkStatus,
} from "@/lib/admin/adminConsoleLinks";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function getStatusClassName(status: AdminConsoleLinkStatus) {
  if (status === "linked") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "api") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "legacy") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-stone-200 bg-stone-100 text-stone-500";
}

function useConsoleItemText() {
  const t = useAdminTranslation();

  return (item: AdminConsoleLinkItem) => ({
    label: t(`adminConsole.links.${item.id}.label`, item.label),
    description: t(`adminConsole.links.${item.id}.description`, item.description),
    statusLabel: t(`adminConsole.statuses.${item.status}`, item.statusLabel),
    openLabel: t("adminConsole.actions.open", "화면 열기"),
    preparingLabel: t("adminConsole.statuses.planned", "준비중"),
  });
}

function AdminConsoleCard({ item }: { item: AdminConsoleLinkItem }) {
  const translateItem = useConsoleItemText();
  const text = translateItem(item);

  return (
    <article className="h-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-950">{text.label}</h2>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
          {text.statusLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{text.description}</p>
      {item.href ? (
        <Link href={item.href} className="mt-4 inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800">
          {text.openLabel}
        </Link>
      ) : item.apiPath ? (
        <code className="mt-4 block truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
          {item.apiPath}
        </code>
      ) : (
        <span className="mt-4 inline-flex rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400">
          {text.preparingLabel}
        </span>
      )}
    </article>
  );
}

export default function AdminConsoleSections() {
  const t = useAdminTranslation();

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-4">
        {ADMIN_CONSOLE_PRIMARY_LINKS.map((item) => (
          <AdminConsoleCard key={item.id} item={item} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.operationsMenu.title", "운영 메뉴")}</h2>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {t("adminConsole.operationsMenu.description", "고객관리자 메인에서는 실제 작업 진행과 바로 실행할 메뉴를 우선 노출합니다. 히스토리는 추적용 화면으로 유지하되 메인 상황판의 중심 지표에서는 분리합니다.")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ADMIN_CONSOLE_SECONDARY_LINKS.map((item) => (
              <AdminConsoleCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.apiReady.title", "API 연결 준비")}</h2>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {t("adminConsole.apiReady.description", "실제 고객사 데이터는 repository와 API에서 집계하고, 화면은 요약 결과만 표시합니다.")}
          </p>
          <div className="mt-4 grid gap-3">
            {ADMIN_CONSOLE_API_LINKS.map((item) => (
              <AdminConsoleCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">{t("adminConsole.policyNotes.title", "운영 정책 메모")}</h2>
        <ul className="mt-4 grid gap-3 lg:grid-cols-4">
          {ADMIN_CONSOLE_POLICY_NOTES.map((note, index) => (
            <li key={note} className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600">
              {t(`adminConsole.policyNotes.items.${index}`, note)}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
