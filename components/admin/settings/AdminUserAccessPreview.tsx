import { AdminCard } from "@/components/admin/layout/AdminCard";
import { buildAdminUserAccessViewModel, type AdminUserAccessSourceState } from "@/lib/admin/settings/userAccessPresentation";
import { getI18n } from "@/lib/i18n";
import type { UserProfile } from "@/types/user";

function PermissionFlag({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
      {label}
    </span>
  );
}

type AdminUserAccessPreviewProps = {
  users?: readonly UserProfile[];
  sourceState?: AdminUserAccessSourceState;
};

export default function AdminUserAccessPreview({ users, sourceState }: AdminUserAccessPreviewProps) {
  const text = getI18n().admin.userAccessPreview;
  const viewModel = buildAdminUserAccessViewModel(users, sourceState);

  return (
    <AdminCard className="shrink-0 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-stone-950">{text.title}</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{text.sourceStates[viewModel.sourceState]}</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">{text.description}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold text-stone-500">{text.userCountLabel}</p>
          <p className="mt-1 text-2xl font-semibold text-stone-950">{viewModel.userCount}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-stone-200 bg-stone-50 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-stone-950">{text.testUsersTitle}</h3>
            <span className="text-xs font-semibold text-stone-400">{text.readOnlyBadge}</span>
          </div>
          <div className="mt-3 grid gap-2">
            {viewModel.users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">{user.name}</p>
                    <p className="mt-1 text-xs font-semibold text-stone-500">{user.roleSummary}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <PermissionFlag active={user.canAssignRoles} label={text.permissionLabels.canAssignRoles} />
                    <PermissionFlag active={user.canEditInventory} label={text.permissionLabels.canEditInventory} />
                    <PermissionFlag active={user.canSeeCostSections} label={text.permissionLabels.canSeeCostSections} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-3.5">
          <h3 className="text-sm font-semibold text-stone-950">{text.checklistTitle}</h3>
          <div className="mt-3 grid gap-2">
            {viewModel.checklist.map((item) => {
              const label = text.checklist[item.id as keyof typeof text.checklist] ?? item.id;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-stone-600">{label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-stone-200 text-stone-500"}`}>
                    {item.done ? text.status.ready : text.status.pending}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl bg-stone-950 px-3 py-3 text-xs leading-5 text-white/80">
            {text.nextStep}
          </div>
        </section>
      </div>
    </AdminCard>
  );
}
