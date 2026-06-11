"use client";

import { useMemo, useState } from "react";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  AdminModal,
  AdminModalSection,
} from "@/components/admin/layout/AdminModal";
import { WaflInfoBox } from "@/components/common/ui/WaflForm";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { buildUserRoleState, ROLE_OPTIONS } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";
import {
  buildAdminUserAccessViewModel,
  type AdminUserAccessSourceState,
} from "@/lib/admin/settings/userAccessPresentation";
import { getI18n } from "@/lib/i18n";
import type { UserProfile } from "@/types/user";

function PermissionFlag({ active, label }: { active: boolean; label: string }) {
  return (
    <AdminStatusBadge tone={active ? "success" : "neutral"} size="sm">
      {label}
    </AdminStatusBadge>
  );
}

type AdminUserAccessPreviewProps = {
  users?: readonly UserProfile[];
  sourceState?: AdminUserAccessSourceState;
};

function applyRoleToUser(user: UserProfile, role: RoleType): UserProfile {
  return {
    ...user,
    ...buildUserRoleState([role]),
  };
}

export default function AdminUserAccessPreview({
  users,
  sourceState,
}: AdminUserAccessPreviewProps) {
  const text = getI18n().admin.userAccessPreview;
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [workingUsers, setWorkingUsers] = useState<readonly UserProfile[]>(
    users ?? [],
  );
  const effectiveUsers = workingUsers.length > 0 ? workingUsers : users;
  const viewModel = useMemo(
    () => buildAdminUserAccessViewModel(effectiveUsers, sourceState),
    [effectiveUsers, sourceState],
  );

  const handleRoleChange = (userId: string, role: RoleType) => {
    setWorkingUsers((current) =>
      (current.length > 0 ? current : (users ?? [])).map((user) =>
        user.id === userId ? applyRoleToUser(user, role) : user,
      ),
    );
  };

  return (
    <AdminCard className="shrink-0 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--pbp-text-primary)]">
              {text.title}
            </h2>
            <AdminStatusBadge tone="warning" size="sm">
              {text.sourceStates[viewModel.sourceState]}
            </AdminStatusBadge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]">
            {text.description}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row lg:flex-col lg:items-end">
          <AdminButton
            type="button"
            variant="primary"
            onClick={() => setIsRoleModalOpen(true)}
          >
            {text.manageRolesButton}
          </AdminButton>
          <WaflSurface
            shape="control"
            tone="muted"
            className="px-4 py-3 text-right"
          >
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">
              {text.userCountLabel}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--pbp-text-primary)]">
              {viewModel.userCount}
            </p>
          </WaflSurface>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <WaflSurface
          as="section"
          shape="control"
          tone="muted"
          className="p-3.5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
              {text.testUsersTitle}
            </h3>
            <span className="text-xs font-semibold text-[var(--pbp-text-subtle)]">
              {text.roleModal.previewBadge}
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {viewModel.users.map((user) => (
              <WaflSurface
                key={user.id}
                shape="control"
                tone="surface"
                className="p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">
                      {user.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">
                      {user.roleSummary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <PermissionFlag
                      active={user.canAssignRoles}
                      label={text.permissionLabels.canAssignRoles}
                    />
                    <PermissionFlag
                      active={user.canEditInventory}
                      label={text.permissionLabels.canEditInventory}
                    />
                    <PermissionFlag
                      active={user.canSeeCostSections}
                      label={text.permissionLabels.canSeeCostSections}
                    />
                  </div>
                </div>
              </WaflSurface>
            ))}
          </div>
        </WaflSurface>

        <WaflSurface
          as="section"
          shape="control"
          tone="surface"
          className="p-3.5"
        >
          <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
            {text.checklistTitle}
          </h3>
          <div className="mt-3 grid gap-2">
            {viewModel.checklist.map((item) => {
              const label =
                text.checklist[item.id as keyof typeof text.checklist] ??
                item.id;
              return (
                <WaflSurface
                  key={item.id}
                  shape="control"
                  tone="muted"
                  className="flex items-center justify-between gap-3 border-transparent px-3 py-2.5"
                >
                  <span className="text-xs font-semibold text-[var(--pbp-text-secondary)]">
                    {label}
                  </span>
                  <AdminStatusBadge
                    tone={item.done ? "success" : "neutral"}
                    size="sm"
                  >
                    {item.done ? text.status.ready : text.status.pending}
                  </AdminStatusBadge>
                </WaflSurface>
              );
            })}
          </div>
          <WaflInfoBox
            shape="control"
            tone="info"
            component="user-access-next-step"
            className="mt-4 text-xs leading-5"
          >
            {text.nextStep}
          </WaflInfoBox>
        </WaflSurface>
      </div>

      <AdminModal
        open={isRoleModalOpen}
        title={text.roleModal.title}
        description={text.roleModal.description}
        onClose={() => setIsRoleModalOpen(false)}
        maxWidthClass="md:max-w-4xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => setWorkingUsers(users ?? [])}
            >
              {text.roleModal.resetButton}
            </AdminButton>
            <AdminButton
              type="button"
              variant="primary"
              onClick={() => setIsRoleModalOpen(false)}
            >
              {text.roleModal.closeButton}
            </AdminButton>
          </div>
        }
      >
        <AdminModalSection
          title={text.roleModal.sectionTitle}
          description={text.roleModal.sectionDescription}
        >
          <div className="grid gap-3">
            {viewModel.users.map((user) => {
              const sourceUser = (effectiveUsers ?? []).find(
                (item) => item.id === user.id,
              );
              return (
                <WaflSurface
                  key={user.id}
                  shape="control"
                  tone="muted"
                  className="p-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">
                        {user.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">
                        {user.roleSummary}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_OPTIONS.map((option) => {
                        const active = sourceUser?.role === option.role;
                        return (
                          <AdminButton
                            key={`${user.id}-${option.role}`}
                            type="button"
                            variant={active ? "primary" : "secondary"}
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              handleRoleChange(user.id, option.role)
                            }
                          >
                            {option.title}
                          </AdminButton>
                        );
                      })}
                    </div>
                  </div>
                </WaflSurface>
              );
            })}
          </div>
        </AdminModalSection>
      </AdminModal>
    </AdminCard>
  );
}
