import { AdminCard } from "@/components/admin/layout/AdminCard";
import type { AdminDbCompletionSummary, AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";

type AdminDbConnectionAuditPanelProps = {
  summary: AdminDbCompletionSummary;
};

function getStatusClassName(status: AdminDbScreenAuditStatus): string {
  if (status === "db-connected") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "db-prepared") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "fallback-guarded") return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-stone-100 text-stone-500 ring-stone-200";
}

function getStatusLabel(status: AdminDbScreenAuditStatus): string {
  if (status === "db-connected") return "DB 연결";
  if (status === "db-prepared") return "DB 준비";
  if (status === "fallback-guarded") return "fallback 보호";
  return "대상 아님";
}

export default function AdminDbConnectionAuditPanel({ summary }: AdminDbConnectionAuditPanelProps) {
  return (
    <AdminCard className="mt-5">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">DB 연결 점검</h2>
          <p className="mt-1 text-xs text-stone-500">관리자 화면별 실제 DB 조회/저장 경계와 fallback 상태입니다.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
          <span className="rounded-full bg-stone-100 px-3 py-1.5">workorder={summary.repositoryModes.workorder}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">partner={summary.repositoryModes.partner}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">memo={summary.repositoryModes.attachmentMemo}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {summary.items.map((item) => (
          <article key={item.key} className="rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-950">{item.screen}</h3>
                <p className="mt-1 truncate text-xs text-stone-400">{item.routePath}</p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClassName(item.status)}`}>
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-stone-500 lg:grid-cols-2">
              <div>
                <dt className="font-semibold text-stone-700">조회</dt>
                <dd className="mt-1">{item.readSource}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">저장</dt>
                <dd className="mt-1">{item.writeSource}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">fallback</dt>
                <dd className="mt-1">{item.fallback}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">다음 확인</dt>
                <dd className="mt-1">{item.nextCheck}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </AdminCard>
  );
}
