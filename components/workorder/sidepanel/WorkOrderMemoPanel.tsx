"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { SectionCountBadge } from "@/components/common/ui";
import { WorkOrderPanelCard } from "@/components/common/ui";
import { WorkOrderMiniActionButton } from "@/components/workorder/common/WorkOrderActionButton";
import { useI18n } from "@/lib/i18n";
import { getMemoDisplayContent, getVisibleMemoReplies, getVisibleMemoThreads, isDeletedMemoItem } from "@/lib/workorder/presentation/memoPresentation";
import type { MemoReply, MemoThread, RoleType, UserProfile, WorkOrder } from "@/types/workorder";

const MEMO_MAX_LENGTH = 50;

function padMemoDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatMemoTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return [
    padMemoDatePart(date.getFullYear() % 100),
    padMemoDatePart(date.getMonth() + 1),
    padMemoDatePart(date.getDate()),
  ].join(".") + ` ${padMemoDatePart(date.getHours())}:${padMemoDatePart(date.getMinutes())}`;
}

function normalizeMemoAuthorKey(value: string | null | undefined) {
  return (value ?? "").trim();
}

function findMemoAuthorProfile(authorId: string, users: UserProfile[] | undefined) {
  const normalizedAuthorId = normalizeMemoAuthorKey(authorId);
  if (!normalizedAuthorId || normalizedAuthorId === "system") return null;

  return (users ?? []).find((user) => {
    const userId = normalizeMemoAuthorKey(user.id);
    const companyMemberId = normalizeMemoAuthorKey(user.companyMemberId);
    return userId === normalizedAuthorId || companyMemberId === normalizedAuthorId;
  }) ?? null;
}

function getMemoAuthorDisplayName(author: { authorId: string; authorName: string; authorRole: RoleType }, users: UserProfile[] | undefined, copy: { adminAuthorFallback: string; unknownAuthorFallback: string }) {
  const matchedProfile = findMemoAuthorProfile(author.authorId, users);
  const matchedName = matchedProfile?.name?.trim();
  if (matchedName) return matchedName;

  const normalizedName = author.authorName.trim();
  if (normalizedName && normalizedName !== author.authorId) return normalizedName;

  return copy.unknownAuthorFallback;
}

function normalizeMemoInput(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, MEMO_MAX_LENGTH);
}

function isAdminRole(role: RoleType) {
  return role === "admin";
}

type MemoInputFieldProps = {
  value: string;
  disabled: boolean;
  placeholder: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  isMobile?: boolean;
};

function MemoInputField({ value, disabled, placeholder, submitLabel, onChange, onSubmit, onCancel, cancelLabel, isMobile = false }: MemoInputFieldProps) {
  const trimmed = value.trim();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!disabled && trimmed) onSubmit();
      return;
    }
    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="min-w-0">
      <textarea
        rows={1}
        maxLength={MEMO_MAX_LENGTH}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeMemoInput(event.target.value))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={isMobile
          ? "pbp-field-interaction pbp-workorder-editable-input h-[34px] w-full resize-none overflow-hidden rounded-lg border px-2.5 py-1.5 text-base outline-none disabled:cursor-not-allowed disabled:opacity-60"
          : "pbp-field-interaction pbp-workorder-editable-input h-[32px] w-full resize-none overflow-hidden rounded-lg border px-2.5 py-1.5 text-base outline-none disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"}
      />
      <div className={isMobile ? "mt-1.5 flex flex-wrap items-center justify-between gap-2" : "mt-1.5 flex items-center justify-end gap-2"}>
        <span className="mr-auto text-[10px] font-medium text-[var(--pbp-field-disabled-text)]" aria-live="polite">{`${value.length} / ${MEMO_MAX_LENGTH}`}</span>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="pbp-interactive-button pbp-action-secondary rounded-full px-3 py-1.5 text-[11px] font-semibold">
            {cancelLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !trimmed}
          title={disabled ? placeholder : submitLabel}
          className={isMobile
            ? "pbp-interactive-button pbp-action-primary rounded-full px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            : "pbp-interactive-button pbp-action-primary rounded-full px-3 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function MemoPencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-3 w-3">
      <path d="M13.9 2.6a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1l-8.8 8.8-3.6.7.7-3.6 8.2-8.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12.5 4 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MemoItemActions({ canMutate, editLabel, deleteAriaLabel, onEdit, onDelete, disabledReason }: { canMutate: boolean; editLabel: string; deleteAriaLabel: string; onEdit: () => void; onDelete: () => void; disabledReason?: string }) {
  if (!canMutate) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <WorkOrderMiniActionButton
        label={editLabel}
        onClick={onEdit}
        title={disabledReason ?? editLabel}
        className="text-[var(--pbp-warning)]"
      >
        <MemoPencilIcon />
      </WorkOrderMiniActionButton>
      <WorkOrderMiniActionButton
        label={deleteAriaLabel}
        tone="dangerSoft"
        onClick={onDelete}
        title={disabledReason ?? deleteAriaLabel}
      >
        -
      </WorkOrderMiniActionButton>
    </div>
  );
}

function MemoThreadCard({
  thread,
  onCreateReply,
  onUpdateThread,
  onDeleteThread,
  onUpdateReply,
  onDeleteReply,
  canEditMemo,
  writeLocked = false,
  writeLockMessage,
  currentUserId,
  currentUserRole,
  users,
  workOrderId,
  variant = "desktop",
}: {
  thread: MemoThread;
  onCreateReply: (threadId: string, content: string) => void;
  onUpdateThread: (threadId: string, content: string) => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateReply: (threadId: string, replyId: string, content: string) => void;
  onDeleteReply: (threadId: string, replyId: string) => void;
  canEditMemo: boolean;
  writeLocked?: boolean;
  writeLockMessage?: string;
  currentUserId: string;
  currentUserRole: RoleType;
  users?: UserProfile[];
  workOrderId: string;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const isMobile = variant === "mobile";
  const [replyDraft, setReplyDraft] = useState("");
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);
  const [editingThread, setEditingThread] = useState(false);
  const [threadEditDraft, setThreadEditDraft] = useState(normalizeMemoInput(thread.content));
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyEditDraft, setReplyEditDraft] = useState("");

  useEffect(() => {
    setReplyDraft("");
    setReplyComposerOpen(false);
    setEditingThread(false);
    setThreadEditDraft(normalizeMemoInput(thread.content));
    setEditingReplyId(null);
    setReplyEditDraft("");
  }, [thread.id, thread.content, workOrderId]);

  const canMutateAuthor = (authorId: string) => canEditMemo && (isAdminRole(currentUserRole) || authorId === currentUserId);
  const isThreadDeleted = isDeletedMemoItem(thread, ui.memo.deleted);
  const canMutateThread = canMutateAuthor(thread.authorId) && !isThreadDeleted && !writeLocked;

  const submitReply = () => {
    const nextContent = replyDraft.trim();
    if (!canEditMemo || writeLocked || isThreadDeleted || !nextContent) return;
    onCreateReply(thread.id, nextContent);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) document.activeElement.blur();
    setReplyDraft("");
    setReplyComposerOpen(false);
  };

  const submitThreadEdit = () => {
    const nextContent = threadEditDraft.trim();
    if (!canMutateThread || !nextContent) return;
    onUpdateThread(thread.id, nextContent);
    setEditingThread(false);
  };

  const startReplyEdit = (reply: MemoReply) => {
    setEditingReplyId(reply.id);
    setReplyEditDraft(normalizeMemoInput(reply.content));
  };

  const submitReplyEdit = (replyId: string) => {
    const nextContent = replyEditDraft.trim();
    if (!nextContent) return;
    onUpdateReply(thread.id, replyId, nextContent);
    setEditingReplyId(null);
    setReplyEditDraft("");
  };

  return (
    <div className={isMobile ? "pbp-sidepanel-item min-w-0 rounded-2xl border p-2.5 shadow-sm" : "pbp-sidepanel-item min-w-0 rounded-2xl border p-3 shadow-sm"}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={isMobile ? "break-words text-[13px] font-semibold leading-4 pbp-text-primary" : "truncate text-sm font-semibold pbp-text-primary"}>{getMemoAuthorDisplayName(thread, users, ui.memo)}</div>
          <div className="mt-0.5 text-[11px] pbp-text-muted">{formatMemoTimestamp(thread.createdAt)}</div>
        </div>
        <MemoItemActions
          canMutate={canMutateThread}
          disabledReason={writeLockMessage}
          editLabel={ui.memo.edit}
          deleteAriaLabel={ui.memo.deleteAria}
          onEdit={() => {
            setEditingThread(true);
            setThreadEditDraft(normalizeMemoInput(thread.content));
          }}
          onDelete={() => onDeleteThread(thread.id)}
        />
      </div>

      {editingThread ? (
        <div className="pbp-workorder-editable-panel mt-2 rounded-xl border p-2">
          <MemoInputField
            value={threadEditDraft}
            disabled={!canMutateThread}
            placeholder={ui.memo.threadPlaceholder}
            submitLabel={ui.memo.save}
            cancelLabel={ui.memo.cancel}
            onChange={setThreadEditDraft}
            onSubmit={submitThreadEdit}
            onCancel={() => {
              setEditingThread(false);
              setThreadEditDraft(normalizeMemoInput(thread.content));
            }}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <div className={isMobile
          ? `mt-2 break-words whitespace-pre-wrap text-[12px] leading-5 ${isThreadDeleted ? "italic text-[var(--pbp-field-disabled-text)]" : "text-[var(--pbp-text-muted)]"}`
          : `mt-2 whitespace-pre-wrap text-[13px] leading-5 ${isThreadDeleted ? "italic text-[var(--pbp-field-disabled-text)]" : "text-[var(--pbp-text-muted)]"}`
        }>{getMemoDisplayContent(thread, ui.memo.deleted)}</div>
      )}

      <div className="mt-3 space-y-2 border-t border-[var(--pbp-border)] pt-3">
        {getVisibleMemoReplies(thread.replies ?? []).length > 0 ? getVisibleMemoReplies(thread.replies ?? []).map((reply, replyIndex) => {
          const isEditingReply = editingReplyId === reply.id;
          return (
            <div key={`${thread.id}-${reply.id}-${replyIndex}`} className="min-w-0 pl-2 text-[var(--pbp-text-muted)] sm:pl-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 break-words text-[11px] leading-4 pbp-text-muted">{ui.memo.replyMarker} {getMemoAuthorDisplayName(reply, users, ui.memo)} · {formatMemoTimestamp(reply.createdAt)}</div>
                <MemoItemActions canMutate={canMutateAuthor(reply.authorId) && !writeLocked} disabledReason={writeLockMessage} editLabel={ui.memo.edit} deleteAriaLabel={ui.memo.deleteAria} onEdit={() => startReplyEdit(reply)} onDelete={() => onDeleteReply(thread.id, reply.id)} />
              </div>
              {isEditingReply ? (
                <div className="pbp-workorder-editable-panel mt-1.5 rounded-xl border p-2">
                  <MemoInputField
                    value={replyEditDraft}
                    disabled={!canMutateAuthor(reply.authorId) || writeLocked}
                    placeholder={ui.memo.replyPlaceholder}
                    submitLabel={ui.memo.save}
            cancelLabel={ui.memo.cancel}
                    onChange={setReplyEditDraft}
                    onSubmit={() => submitReplyEdit(reply.id)}
                    onCancel={() => {
                      setEditingReplyId(null);
                      setReplyEditDraft("");
                    }}
                    isMobile={isMobile}
                  />
                </div>
              ) : (
                <div className="mt-0.5 break-words whitespace-pre-wrap text-[13px] leading-5">{reply.content}</div>
              )}
            </div>
          );
        }) : null}

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 pt-1">
          <button type="button" onClick={() => setReplyComposerOpen((prev) => !prev)} disabled={!canEditMemo || writeLocked || isThreadDeleted} title={writeLocked ? writeLockMessage : undefined} className="pbp-interactive-button pbp-action-secondary rounded-full px-3 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-50">
            {replyComposerOpen ? ui.memo.toggleReplyClose : ui.memo.toggleReplyOpen}
          </button>
        </div>

        {replyComposerOpen ? (
          <div className="pbp-workorder-editable-panel min-w-0 rounded-xl border p-2.5">
            <MemoInputField value={replyDraft} disabled={!canEditMemo || writeLocked || isThreadDeleted} placeholder={ui.memo.replyPlaceholder} submitLabel={ui.memo.submit} onChange={setReplyDraft} onSubmit={submitReply} isMobile={isMobile} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function WorkOrderMemoPanel({
  workOrder,
  currentUserId,
  currentUserName,
  currentUserRole,
  users,
  onCreateThread,
  onCreateReply,
  onUpdateThread,
  onDeleteThread,
  onUpdateReply,
  onDeleteReply,
  canEditMemo,
  writeLocked = false,
  writeLockMessage,
  variant = "desktop",
}: {
  workOrder: WorkOrder;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: RoleType;
  users?: UserProfile[];
  onCreateThread: (content: string) => void;
  onCreateReply: (threadId: string, content: string) => void;
  onUpdateThread: (threadId: string, content: string) => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateReply: (threadId: string, replyId: string, content: string) => void;
  onDeleteReply: (threadId: string, replyId: string) => void;
  canEditMemo: boolean;
  writeLocked?: boolean;
  writeLockMessage?: string;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const isMobile = variant === "mobile";
  const isTablet = variant === "tablet";
  const [threadDraft, setThreadDraft] = useState("");
  const memoThreads = getVisibleMemoThreads(workOrder.memoThreads ?? []);

  useEffect(() => {
    setThreadDraft("");
  }, [workOrder.id]);

  const submitThread = () => {
    const nextContent = threadDraft.trim();
    if (!canEditMemo || writeLocked || !nextContent) return;
    onCreateThread(nextContent);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) document.activeElement.blur();
    setThreadDraft("");
  };

  const isFlatDevice = isMobile || isTablet;
  const content = (
    <>
      {!isFlatDevice ? (
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h3 className="truncate text-sm font-semibold pbp-text-primary">{ui.memo.panelTitle}</h3>
          <SectionCountBadge>{`${memoThreads.length}${ui.memo.countSuffix}`}</SectionCountBadge>
        </div>
      ) : null}
      <div className={isMobile ? "pbp-workorder-editable-panel min-w-0 rounded-xl border p-2" : isTablet ? "pbp-workorder-editable-panel min-w-0 rounded-xl border p-2.5" : "pbp-workorder-editable-panel mt-3 min-w-0 rounded-xl border p-2.5"}>
        <div className="text-[11px] pbp-text-muted">{ui.memo.authorPrefix} {getMemoAuthorDisplayName({ authorId: currentUserId, authorName: currentUserName, authorRole: currentUserRole }, users, ui.memo)}</div>
        <div className="mt-2">
          <MemoInputField value={threadDraft} disabled={!canEditMemo || writeLocked} placeholder={ui.memo.threadPlaceholder} submitLabel={ui.memo.submit} onChange={setThreadDraft} onSubmit={submitThread} isMobile={isMobile} />
        </div>
      </div>
      <div className={isMobile ? "min-w-0 space-y-1.5" : "min-w-0 space-y-2"}>
        {memoThreads.length > 0 ? memoThreads.map((thread, threadIndex) => (
          <MemoThreadCard
            key={`${workOrder.id}-${thread.id}-${threadIndex}`}
            thread={thread}
            onCreateReply={onCreateReply}
            onUpdateThread={onUpdateThread}
            onDeleteThread={onDeleteThread}
            onUpdateReply={onUpdateReply}
            onDeleteReply={onDeleteReply}
            workOrderId={workOrder.id}
            variant={variant}
            canEditMemo={canEditMemo}
            writeLocked={writeLocked}
            writeLockMessage={writeLockMessage}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            users={users}
          />
        )) : <div className="pbp-empty-state min-w-0 rounded-xl border border-dashed px-3 py-5 text-center text-sm">{ui.memo.empty}</div>}
      </div>
    </>
  );

  return isFlatDevice ? (
    <div className="min-w-0 space-y-2.5">{content}</div>
  ) : (
    <WorkOrderPanelCard className="min-w-0">{content}</WorkOrderPanelCard>
  );
}
