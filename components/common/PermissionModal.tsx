"use client";

import { useEffect, useRef } from "react";

type PermissionKey =
  | "createWorkorder"
  | "reviewRequest"
  | "reviewApprove"
  | "orderRequest"
  | "orderConfirm"
  | "inbound"
  | "inspection"
  | "inventoryEdit"
  | "permissionManage";

type PermissionSet = Record<PermissionKey, boolean>;

type UserProfile = {
  id: string;
  name: string;
  team: string;
  permissions: PermissionSet;
};

const PERMISSION_LABELS: { key: PermissionKey; label: string }[] = [
  { key: "createWorkorder", label: "작업지시 생성/수정" },
  { key: "reviewRequest", label: "검토 요청" },
  { key: "reviewApprove", label: "검토 승인/반려" },
  { key: "orderRequest", label: "발주 요청" },
  { key: "orderConfirm", label: "발주 확정" },
  { key: "inbound", label: "입고 등록" },
  { key: "inspection", label: "검수 완료" },
  { key: "inventoryEdit", label: "재고 수정" },
  { key: "permissionManage", label: "권한 설정" },
];

const PRESETS: { label: string; permissions: PermissionSet }[] = [
  {
    label: "디자이너 기본",
    permissions: {
      createWorkorder: true,
      reviewRequest: true,
      reviewApprove: false,
      orderRequest: true,
      orderConfirm: false,
      inbound: false,
      inspection: false,
      inventoryEdit: false,
      permissionManage: false,
    },
  },
  {
    label: "관리자 기본",
    permissions: {
      createWorkorder: true,
      reviewRequest: true,
      reviewApprove: true,
      orderRequest: true,
      orderConfirm: true,
      inbound: true,
      inspection: true,
      inventoryEdit: true,
      permissionManage: true,
    },
  },
  {
    label: "입고/검수 기본",
    permissions: {
      createWorkorder: false,
      reviewRequest: false,
      reviewApprove: false,
      orderRequest: false,
      orderConfirm: false,
      inbound: true,
      inspection: true,
      inventoryEdit: true,
      permissionManage: false,
    },
  },
];

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("inert") && !element.getAttribute("aria-hidden"));
}

export default function PermissionModal({
  open,
  onClose,
  users,
  currentUserId,
  selectedUserId,
  onSelectedUserChange,
  onTogglePermission,
  onApplyPreset,
}: {
  open: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  selectedUserId: string;
  onSelectedUserChange: (id: string) => void;
  onTogglePermission: (userId: string, key: PermissionKey) => void;
  onApplyPreset: (userId: string, permissions: PermissionSet) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(dialog);
      (focusables[0] ?? dialog).focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const selectedUser = users.find((item) => item.id === selectedUserId) ?? users[0];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="permission-modal-title">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 top-[max(env(safe-area-inset-top),12px)] flex h-[calc(100dvh-max(env(safe-area-inset-top),12px))] flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl outline-none md:left-1/2 md:top-1/2 md:bottom-auto md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div id="permission-modal-title" className="text-lg font-semibold text-stone-900">권한 설정</div>
              <div className="mt-1 text-sm text-stone-500 break-keep">사용자별 권한을 스위치로 조정하는 테스트 화면입니다.</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 whitespace-nowrap rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm"
            >
              닫기
            </button>
          </div>
        </div>

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
                    <div className={`mt-1 text-xs ${active ? "text-stone-300" : "text-stone-500"}`}>{user.team}</div>
                    {isCurrent && <div className={`mt-2 text-[11px] ${active ? "text-stone-200" : "text-cyan-700"}`}>현재 선택 사용자</div>}
                  </button>
                );
              })}
            </div>

            <div className="min-w-0 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-stone-900">{selectedUser.name}</div>
                  <div className="mt-1 text-sm text-stone-500">{selectedUser.team}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onApplyPreset(selectedUser.id, preset.permissions)}
                      className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {PERMISSION_LABELS.map((item) => {
                  const enabled = selectedUser.permissions[item.key];
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-stone-900">{item.label}</div>
                        <div className="mt-1 text-xs text-stone-500">{enabled ? "권한 허용" : "권한 비허용"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTogglePermission(selectedUser.id, item.key)}
                        className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-stone-900" : "bg-stone-300"}`}
                        aria-label={`${item.label} ${enabled ? "끄기" : "켜기"}`}
                        aria-pressed={enabled}
                      >
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
