"use client";

import { useMemo } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { DEFAULT_ROLE, ROLE_DISPLAY_GUIDE, formatRoles, normalizeRoles, toRoleType } from "@/lib/constants/roles";
import { useI18n } from "@/lib/i18n";
import { SELECTABLE_CARD_CLASS, SELECTABLE_CARD_SUBTEXT_CLASS } from "@/lib/constants/display";
import { MODAL_CONTENT_MUTED_PANEL_CLASS, MODAL_CONTENT_SECTION_PANEL_CLASS, MODAL_CONTENT_SUBTEXT_CLASS } from "@/components/common/modal/modalContentClassNames";
import type { RoleType, UserProfile } from "@/types/workorder";

type NormalizedRoleOption = {
  role: RoleType;
  title: string;
  description: string;
};

const ROLE_FALLBACKS: Record<RoleType, NormalizedRoleOption> = Object.fromEntries(
  ROLE_DISPLAY_GUIDE.map((item) => [item.role, item]),
) as Record<RoleType, NormalizedRoleOption>;

function normalizeRoleOption(item: unknown, index: number): NormalizedRoleOption {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const normalizedRole =
      toRoleType(record.role) ??
      toRoleType(record.value) ??
      toRoleType(record.key) ??
      toRoleType(record.id) ??
      toRoleType(record.title) ??
      toRoleType(record.label) ??
      toRoleType(record.name);

    if (normalizedRole) {
      const fallback = ROLE_FALLBACKS[normalizedRole];
      return {
        role: normalizedRole,
        title:
          typeof record.title === "string"
            ? record.title
            : typeof record.label === "string"
              ? record.label
              : typeof record.name === "string"
                ? record.name
                : fallback.title,
        description:
          typeof record.description === "string" && record.description.trim().length > 0
            ? record.description
            : typeof record.desc === "string" && record.desc.trim().length > 0
              ? record.desc
              : fallback.description,
      };
    }
  }

  const fallbackRole = ROLE_DISPLAY_GUIDE[index]?.role ?? DEFAULT_ROLE;
  return ROLE_FALLBACKS[fallbackRole];
}

export default function PermissionModal({
  open,
  onClose,
  users,
  currentUserId,
  selectedUserId,
  onSelectedUserChange,
  onApplyRoles,
  onCurrentUserChange,
}: {
  open: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  selectedUserId: string;
  onSelectedUserChange: (id: string) => void;
  onApplyRoles: (userId: string, roles: RoleType[]) => void;
  onCurrentUserChange: (userId: string) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.permission;
  const selectedUser = users.find((item) => item.id === selectedUserId) ?? users[0];
  const normalizedRoleOptions = useMemo<NormalizedRoleOption[]>(() => {
    const normalized = ROLE_DISPLAY_GUIDE.map((item, index) => normalizeRoleOption(item, index));
    const uniqueByRole = new Map<RoleType, NormalizedRoleOption>();
    normalized.forEach((item) => uniqueByRole.set(item.role, item));
    ROLE_DISPLAY_GUIDE.forEach(({ role }) => {
      if (!uniqueByRole.has(role)) {
        uniqueByRole.set(role, ROLE_FALLBACKS[role]);
      }
    });
    return Array.from(uniqueByRole.values());
  }, []);

  if (!selectedUser) return null;

  const activeRoles = normalizeRoles(selectedUser.roles, selectedUser.role);

  const toggleRole = (role: RoleType) => {
    const checked = activeRoles.includes(role);
    const nextRoles = checked ? activeRoles.filter((item) => item !== role) : [...activeRoles, role];
    onApplyRoles(selectedUser.id, nextRoles);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-2xl"
    >
      <div className={`mb-4 ${MODAL_CONTENT_MUTED_PANEL_CLASS} p-4`}>
        <div className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.currentUserSectionTitle}</div>
        <div className={`mt-1 ${MODAL_CONTENT_SUBTEXT_CLASS}`}>{copy.currentUserSectionDescription}</div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {users.map((user) => {
            const active = user.id === currentUserId;
            return (
              <button
                key={`current-${user.id}`}
                type="button"
                onClick={() => onCurrentUserChange(user.id)}
                className={`rounded-2xl border px-4 py-3 text-left ${active ? SELECTABLE_CARD_CLASS.active : SELECTABLE_CARD_CLASS.inactive}`}
              >
                <div className="text-sm font-semibold">{user.name}</div>
                <div className={`mt-1 text-[11px] ${active ? SELECTABLE_CARD_SUBTEXT_CLASS.active : SELECTABLE_CARD_SUBTEXT_CLASS.inactive}`}>{formatRoles(user.roles, user.role)}</div>
                {active ? <div className="mt-2 text-[11px] text-[var(--pbp-action-primary-text)]">{copy.currentUserBadge}</div> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          {users.map((user) => {
            const active = user.id === selectedUser.id;
            const isCurrent = user.id === currentUserId;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelectedUserChange(user.id)}
                className={`block w-full rounded-2xl border p-4 text-left ${active ? SELECTABLE_CARD_CLASS.active : SELECTABLE_CARD_CLASS.inactive}`}
              >
                <div className="text-sm font-semibold">{user.name}</div>
                <div className={`mt-1 text-xs ${active ? SELECTABLE_CARD_SUBTEXT_CLASS.active : SELECTABLE_CARD_SUBTEXT_CLASS.inactive}`}>{formatRoles(user.roles, user.role)}</div>
                {isCurrent ? (
                  <div className={`mt-2 text-[11px] ${active ? "text-[var(--pbp-action-primary-text)]" : "text-[var(--pbp-selected-text)]"}`}>
                    {copy.selectedUserBadge}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} min-w-0 p-4`}>
          <div>
            <div className="text-base font-semibold text-[var(--pbp-text-primary)]">{selectedUser.name}</div>
            <div className="mt-1 text-sm text-[var(--pbp-text-muted)]">{copy.currentRolesPrefix}: {formatRoles(activeRoles)}</div>
          </div>

          <div className="mt-4 space-y-3">
            {normalizedRoleOptions.map((item) => {
              const checked = activeRoles.includes(item.role);
              return (
                <label
                  key={item.role}
                  className={`flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left ${checked ? SELECTABLE_CARD_CLASS.active : SELECTABLE_CARD_CLASS.inactive}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className={`mt-1 text-xs ${checked ? SELECTABLE_CARD_SUBTEXT_CLASS.active : SELECTABLE_CARD_SUBTEXT_CLASS.inactive}`}>{item.description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(item.role)}
                    className="mt-1 h-4 w-4 rounded border-[var(--pbp-border-strong)] text-[var(--pbp-action-primary-surface)] focus:ring-[var(--pbp-focus-ring)]"
                  />
                </label>
              );
            })}
          </div>

          <div className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} mt-4 p-4`}>
            <div className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.roleGuideTitle}</div>
            <div className="mt-2 space-y-1 text-xs text-[var(--pbp-text-muted)]">
              <div>{copy.roleGuideDesigner}</div>
              <div>{copy.roleGuideAdmin}</div>
              <div>{copy.roleGuideInspector}</div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
