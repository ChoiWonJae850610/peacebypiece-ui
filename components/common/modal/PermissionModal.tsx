"use client";

import { useMemo, useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { ROLE_OPTIONS, formatRoles, normalizeRoles } from "@/lib/constants/roles";
import type { RoleType, UserProfile } from "@/types/workorder";

type NormalizedRoleOption = {
  role: RoleType;
  title: string;
  description: string;
};

const ROLE_FALLBACKS: Record<RoleType, NormalizedRoleOption> = {
  디자이너: {
    role: "디자이너",
    title: "디자이너",
    description: "작업지시 작성, 검토 요청, 발주 요청 중심 역할",
  },
  관리자: {
    role: "관리자",
    title: "관리자",
    description: "전체 승인과 비용, 권한 관리가 가능한 역할",
  },
  "입고/검수": {
    role: "입고/검수",
    title: "입고/검수",
    description: "입고 등록, 검수 완료, 재고 수정 중심 역할",
  },
};

function toRoleType(value: unknown): RoleType | null {
  if (value === "디자이너" || value === "관리자" || value === "입고/검수") {
    return value;
  }
  return null;
}

function normalizeRoleOption(item: unknown, index: number): NormalizedRoleOption {
  if (typeof item === "string") {
    const normalizedRole = toRoleType(item);
    if (normalizedRole) {
      return ROLE_FALLBACKS[normalizedRole];
    }
  }

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

  const fallbackRole = (["디자이너", "관리자", "입고/검수"] as const)[index] ?? "디자이너";
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });

  const selectedUser = users.find((item) => item.id === selectedUserId) ?? users[0];
  const normalizedRoleOptions = useMemo<NormalizedRoleOption[]>(() => {
    const source = Array.isArray(ROLE_OPTIONS) ? ROLE_OPTIONS : [];
    const normalized = source.map((item, index) => normalizeRoleOption(item, index));
    const uniqueByRole = new Map<RoleType, NormalizedRoleOption>();
    normalized.forEach((item) => {
      uniqueByRole.set(item.role, item);
    });
    (["디자이너", "관리자", "입고/검수"] as const).forEach((role) => {
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
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="permission-modal-title" maxWidthClassName="md:max-w-2xl">
      <ModalHeader
        titleId="permission-modal-title"
        title="환경 설정"
        description="테스트용 사용자 전환과 다중 권한 변경을 이 화면에서만 조정합니다."
        onClose={onClose}
      />

      <ModalBody>
        <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="text-sm font-semibold text-stone-900">테스트 화면 기준 사용자</div>
          <div className="mt-1 text-xs text-stone-500">실제 화면에서 보이는 권한과 액션을 빠르게 확인하기 위한 임시 설정입니다.</div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {users.map((user) => {
              const active = user.id === currentUserId;
              return (
                <button
                  key={`current-${user.id}`}
                  type="button"
                  onClick={() => onCurrentUserChange(user.id)}
                  className={`rounded-2xl border px-4 py-3 text-left ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-900"}`}
                >
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className={`mt-1 text-[11px] ${active ? "text-stone-300" : "text-stone-500"}`}>{formatRoles(user.roles, user.role)}</div>
                  {active ? <div className="mt-2 text-[11px] text-stone-200">현재 화면 기준 사용자</div> : null}
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
                  className={`block w-full rounded-2xl border p-4 text-left ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
                >
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className={`mt-1 text-xs ${active ? "text-stone-300" : "text-stone-500"}`}>{formatRoles(user.roles, user.role)}</div>
                  {isCurrent ? (
                    <div className={`mt-2 text-[11px] ${active ? "text-stone-200" : "text-cyan-700"}`}>
                      현재 선택 사용자
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="min-w-0 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div>
              <div className="text-base font-semibold text-stone-900">{selectedUser.name}</div>
              <div className="mt-1 text-sm text-stone-500">현재 권한: {formatRoles(activeRoles)}</div>
            </div>

            <div className="mt-4 space-y-3">
              {normalizedRoleOptions.map((item) => {
                const checked = activeRoles.includes(item.role);
                return (
                  <label
                    key={item.role}
                    className={`flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left ${checked ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-900"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className={`mt-1 text-xs ${checked ? "text-stone-300" : "text-stone-500"}`}>{item.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(item.role)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="text-sm font-semibold text-stone-900">권한 설명</div>
              <div className="mt-2 space-y-1 text-xs text-stone-500">
                <div>디자이너: 작업지시 작성, 검토 요청, 발주 요청</div>
                <div>관리자: 승인, 발주 확정, 역할 지정, 공식 첨부</div>
                <div>입고/검수: 입고 등록, 검수 완료, 재고 수정</div>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
    </BaseModal>
  );
}
