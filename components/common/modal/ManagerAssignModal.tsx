"use client";

import { useMemo, useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { formatRoles, hasRole } from "@/lib/constants/roles";
import type { UserProfile } from "@/types/user";

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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });

  const managerCandidates = useMemo(
    () => users.filter((user) => hasRole(user, "관리자") || hasRole(user, "디자이너")),
    [users],
  );

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="manager-assign-modal-title" maxWidthClassName="md:max-w-lg">
      <ModalHeader
        titleId="manager-assign-modal-title"
        title="담당자 변경"
        description="작성중, 검토요청 단계에서만 담당자를 변경할 수 있습니다."
        onClose={onClose}
      />
      <ModalBody>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          현재 담당자 <span className="ml-1 font-medium text-stone-900">{currentManagerName || "-"}</span>
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
                {selected ? <span className="text-xs font-medium">현재</span> : null}
              </button>
            );
          })}
        </div>
      </ModalBody>
    </BaseModal>
  );
}
