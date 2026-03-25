"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalFocusTrap } from "@/components/common/modal/modalUtils";

type PermissionKey =
  | "createWorkorder"
  | "reviewRequest"
  | "reviewApprove"
  | "orderRequest"
  | "orderConfirm"
  | "inbound"
  | "inspection"
  | "inventoryEdit"
  | "permissionManage"
  | "viewProductionDetails"
  | "viewCost"
  | "viewInventoryHistory"
  | "viewAttachments"
  | "editAttachments";

type PermissionSet = Record<PermissionKey, boolean>;

type UserProfile = {
  id: string;
  name: string;
  team: string;
  permissions: PermissionSet;
};

type RoleType = "디자이너" | "관리자" | "입고/검수";

const ROLE_OPTIONS: { role: RoleType; title: string; description: string }[] = [
  {
    role: "디자이너",
    title: "디자이너",
    description: "작업지시 작성, 검토 요청, 발주 요청 중심",
  },
  {
    role: "관리자",
    title: "관리자",
    description: "전체 승인, 발주 확정, 상태 관리까지 가능",
  },
  {
    role: "입고/검수",
    title: "입고/검수",
    description: "입고 처리, 검수 완료, 재고 수정 중심",
  },
];

function inferRole(user: UserProfile): RoleType {
  if (user.team === "관리자") return "관리자";
  if (user.team === "입고/검수") return "입고/검수";
  return "디자이너";
}

export default function PermissionModal({
  open,
  onClose,
  users,
  currentUserId,
  selectedUserId,
  onSelectedUserChange,
  onApplyRole,
}: {
  open: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  selectedUserId: string;
  onSelectedUserChange: (id: string) => void;
  onApplyRole: (userId: string, role: RoleType) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalFocusTrap({ open, dialogRef, onClose });

  const selectedUser =
    users.find((item) => item.id === selectedUserId) ?? users[0];

  if (!selectedUser) return null;

  const activeRole = inferRole(selectedUser);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="permission-modal-title"
      maxWidthClassName="md:max-w-2xl"
    >
      <ModalHeader
        titleId="permission-modal-title"
        title="권한 설정"
        description="상세 권한 토글을 제거하고 역할 지정만 유지하는 구조로 정리했습니다."
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
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
                  className={`block w-full rounded-2xl border p-4 text-left ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
                >
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div
                    className={`mt-1 text-xs ${active ? "text-stone-300" : "text-stone-500"}`}
                  >
                    {user.team}
                  </div>
                  {isCurrent ? (
                    <div
                      className={`mt-2 text-[11px] ${active ? "text-stone-200" : "text-cyan-700"}`}
                    >
                      현재 선택 사용자
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="min-w-0 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div>
              <div className="text-base font-semibold text-stone-900">
                {selectedUser.name}
              </div>
              <div className="mt-1 text-sm text-stone-500">
                현재 역할: {activeRole}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {ROLE_OPTIONS.map((item) => {
                const checked = item.role === activeRole;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => onApplyRole(selectedUser.id, item.role)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left ${checked ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-900"}`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div
                        className={`mt-1 text-xs ${checked ? "text-stone-300" : "text-stone-500"}`}
                      >
                        {item.description}
                      </div>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${checked ? "border-white" : "border-stone-300"}`}
                    >
                      {checked ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="text-sm font-semibold text-stone-900">
                역할 설명
              </div>
              <div className="mt-2 space-y-1 text-xs text-stone-500">
                <div>디자이너: 작업지시 작성, 검토 요청, 발주 요청</div>
                <div>관리자: 승인, 발주 확정, 역할 지정</div>
                <div>입고/검수: 입고 등록, 검수 완료, 재고 수정</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
