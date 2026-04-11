"use client";

import { useMemo } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { formatRoles, hasRole } from "@/lib/constants/roles";
import type { UserProfile } from "@/types/user";
import { useI18n } from "@/lib/i18n";

export default function ManagerAssignModal({
  open,
  onClose,
  users,
  currentManagerId,
  currentManagerName,
  onSelectManager,
}: {
  open: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentManagerId: string | null;
  currentManagerName: string;
  onSelectManager: (userId: string) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.managerAssign;
  const managerCandidates = useMemo(
    () => users.filter((user) => hasRole(user, "관리자") || hasRole(user, "디자이너")),
    [users],
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-lg"
    >
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        {copy.currentManagerLabel} <span className="ml-1 font-medium text-stone-900">{currentManagerName || "-"}</span>
      </div>

      <div className="mt-4 space-y-2">
        {managerCandidates.map((user) => {
          const selected = currentManagerId ? user.id === currentManagerId : user.name === currentManagerName;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelectManager(user.id)}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
                selected
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50",
              ].join(" ")}
            >
              <div>
                <div className="text-sm font-semibold">{user.name}</div>
                <div className={selected ? "mt-1 text-xs text-white/75" : "mt-1 text-xs text-stone-500"}>{formatRoles(user.roles, user.role)}</div>
              </div>
              {selected ? <span className="text-xs font-medium">{copy.currentBadge}</span> : null}
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}
