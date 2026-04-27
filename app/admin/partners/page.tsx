import Link from "next/link";
import PartnerMasterSection from "@/components/admin/PartnerMasterSection";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.partnerMaster.page;

export default function AdminPartnersPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{pageText.title}</h1>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Link
                  href="/admin"
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  {pageText.moveToAdminMain}
                </Link>
                <Link
                  href="/worker"
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  {pageText.moveToWorkspace}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <PartnerMasterSection />
      </div>
    </main>
  );
}
