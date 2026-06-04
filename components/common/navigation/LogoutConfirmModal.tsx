"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminModal } from "@/components/admin/layout/AdminModal";
import { showWaflLoadingToast } from "@/components/common/ToastMessage";

export type LogoutConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loadingMessage?: string;
};

export default function LogoutConfirmModal({
  open,
  onClose,
  title = "로그아웃하시겠습니까?",
  description = "현재 계정에서 로그아웃합니다. 저장하지 않은 입력 내용이 있다면 먼저 저장해 주세요.",
  cancelLabel = "취소",
  confirmLabel = "로그아웃",
  loadingMessage = "로그아웃 중입니다.",
}: LogoutConfirmModalProps) {
  return (
    <AdminModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      maxWidthClass="md:max-w-md"
      minHeightClassName="md:min-h-[260px]"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton type="button" variant="secondary" onClick={onClose} className="sm:w-auto" width="full">
            {cancelLabel}
          </AdminButton>
          <form
            action="/api/auth/logout"
            method="post"
            onSubmit={() => showWaflLoadingToast(loadingMessage)}
            className="sm:w-auto"
          >
            <AdminButton type="submit" variant="danger" className="sm:w-auto" width="full">
              {confirmLabel}
            </AdminButton>
          </form>
        </div>
      }
    >
      <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--pbp-text-muted)]">
        로그아웃 후에는 다시 로그인해야 업무 화면을 사용할 수 있습니다.
      </div>
    </AdminModal>
  );
}
