"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  SectionCountBadge,
  WaflButton,
  WaflEmptyCard,
  WaflSurface,
  WaflTextarea,
  WAFL_WORKSPACE_EMPTY_CARD_CLASS,
} from "@/components/common/ui";
import { WorkOrderPanelCard } from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import { useI18n } from "@/lib/i18n";
import {
  getMemoDisplayContent,
  getVisibleMemoReplies,
  getVisibleMemoThreads,
  isDeletedMemoItem,
} from "@/lib/workorder/presentation/memoPresentation";
import type {
  MemoReply,
  MemoThread,
  RoleType,
  UserProfile,
  WorkOrder,
} from "@/types/workorder";

const MEMO_MAX_LENGTH = 50;

function padMemoDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatMemoTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return (
    [
      padMemoDatePart(date.getFullYear() % 100),
      padMemoDatePart(date.getMonth() + 1),
      padMemoDatePart(date.getDate()),
    ].join(".") +
    ` ${padMemoDatePart(date.getHours())}:${padMemoDatePart(date.getMinutes())}`
  );
}

function normalizeMemoAuthorKey(value: string | null | undefined) {
  return (value ?? "").trim();
}

function findMemoAuthorProfile(
  authorId: string,
  users: UserProfile[] | undefined,
) {
  const normalizedAuthorId = normalizeMemoAuthorKey(authorId);
  if (!normalizedAuthorId || normalizedAuthorId === "system") return null;

  return (
    (users ?? []).find((user) => {
      const userId = normalizeMemoAuthorKey(user.id);
      const companyMemberId = normalizeMemoAuthorKey(user.companyMemberId);
      return (
        userId === normalizedAuthorId || companyMemberId === normalizedAuthorId
      );
    }) ?? null
  );
}

function getMemoAuthorDisplayName(
  author: { authorId: string; authorName: string; authorRole: RoleType },
  users: UserProfile[] | undefined,
  copy: { adminAuthorFallback: string; unknownAuthorFallback: string },
) {
  const matchedProfile = findMemoAuthorProfile(author.authorId, users);
  const matchedName = matchedProfile?.name?.trim();
  if (matchedName) return matchedName;

  const normalizedName = author.authorName.trim();
  if (normalizedName && normalizedName !== author.authorId)
    return normalizedName;

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

function MemoInputField({
  value,
  disabled,
  placeholder,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
  cancelLabel,
  isMobile = false,
}: MemoInputFieldProps) {
  const trimmed = value.trim();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [value]);

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
      <WaflTextarea
        ref={textareaRef}
        rows={1}
        maxLength={MEMO_MAX_LENGTH}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeMemoInput(event.target.value))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={
          isMobile
            ? "min-h-[34px] resize-none overflow-y-auto px-2.5 py-1.5 text-base"
            : "min-h-[32px] resize-none overflow-y-auto px-2.5 py-1.5 text-base md:text-sm"
        }
      />
      <div
        className={
          isMobile
            ? "mt-1.5 flex flex-wrap items-center justify-between gap-2"
            : "mt-1.5 flex items-center justify-end gap-2"
        }
      >
        <span
          className="mr-auto text-[10px] font-medium text-[var(--pbp-field-disabled-text)]"
          aria-live="polite"
        >{`${value.length} / ${MEMO_MAX_LENGTH}`}</span>
        {onCancel ? (
          <WaflButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="sm"
            className="min-h-8 px-3 py-1.5 text-[11px]"
          >
            {cancelLabel}
          </WaflButton>
        ) : null}
        <WaflButton
          type="button"
          onClick={onSubmit}
          disabled={disabled || !trimmed}
          title={disabled ? placeholder : submitLabel}
          variant="primary"
          size="sm"
          className={
            isMobile
              ? "min-h-8 px-3 py-2 text-xs"
              : "min-h-8 px-3 py-1.5 text-[11px]"
          }
        >
          {submitLabel}
        </WaflButton>
      </div>
    </div>
  );
}

function MemoItemActions({
  canMutate,
  canReply = false,
  editLabel,
  replyLabel = "댓글",
  deleteAriaLabel,
  onEdit,
  onReply,
  onDelete,
}: {
  canMutate: boolean;
  canReply?: boolean;
  editLabel: string;
  replyLabel?: string;
  deleteAriaLabel: string;
  onEdit: () => void;
  onReply?: () => void;
  onDelete: () => void;
}) {
  if (!canMutate && !canReply) return null;
  return (
    <WorkOrderCardActionMenu
      menuLabel="작업메모 작업 더보기"
      editLabel={canMutate ? editLabel : undefined}
      editText={canMutate ? editLabel : undefined}
      onEdit={canMutate ? onEdit : undefined}
      replyLabel={canReply ? replyLabel : undefined}
      replyText={canReply ? replyLabel : undefined}
      onReply={canReply ? onReply : undefined}
      deleteLabel={canMutate ? deleteAriaLabel : undefined}
      deleteText={canMutate ? "삭제" : undefined}
      onDelete={canMutate ? onDelete : undefined}
    />
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
  const [threadEditDraft, setThreadEditDraft] = useState(
    normalizeMemoInput(thread.content),
  );
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

  const canMutateAuthor = (authorId: string) =>
    canEditMemo && (isAdminRole(currentUserRole) || authorId === currentUserId);
  const isThreadDeleted = isDeletedMemoItem(thread, ui.memo.deleted);
  const canMutateThread =
    canMutateAuthor(thread.authorId) && !isThreadDeleted && !writeLocked;

  const submitReply = () => {
    const nextContent = replyDraft.trim();
    if (!canEditMemo || writeLocked || isThreadDeleted || !nextContent) return;
    onCreateReply(thread.id, nextContent);
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLTextAreaElement
    )
      document.activeElement.blur();
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
    <WaflSurface
      component="memo-card"
      shape="control"
      tone="surface"
      className={
        isMobile ? "pbp-sidepanel-item p-2.5" : "pbp-sidepanel-item p-3"
      }
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className={
              isMobile
                ? "break-words text-[13px] font-semibold leading-4 pbp-text-primary"
                : "truncate text-sm font-semibold pbp-text-primary"
            }
          >
            {getMemoAuthorDisplayName(thread, users, ui.memo)}
          </div>
          <div className="mt-0.5 text-[11px] pbp-text-muted">
            {formatMemoTimestamp(thread.createdAt)}
          </div>
        </div>
        <MemoItemActions
          canMutate={canMutateThread}
          canReply={canEditMemo && !writeLocked && !isThreadDeleted}
          editLabel={ui.memo.edit}
          replyLabel={ui.memo.toggleReplyOpen}
          deleteAriaLabel={ui.memo.deleteAria}
          onEdit={() => {
            setEditingThread(true);
            setThreadEditDraft(normalizeMemoInput(thread.content));
          }}
          onReply={() => setReplyComposerOpen((prev) => !prev)}
          onDelete={() => onDeleteThread(thread.id)}
        />
      </div>

      {editingThread ? (
        <WaflSurface
          component="input-card"
          shape="control"
          tone="muted"
          className="pbp-workorder-editable-panel mt-2 p-2"
        >
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
        </WaflSurface>
      ) : (
        <div
          className={
            isMobile
              ? `mt-2 break-words whitespace-pre-wrap text-[12px] leading-5 ${isThreadDeleted ? "italic text-[var(--pbp-field-disabled-text)]" : "text-[var(--pbp-text-muted)]"}`
              : `mt-2 whitespace-pre-wrap text-[13px] leading-5 ${isThreadDeleted ? "italic text-[var(--pbp-field-disabled-text)]" : "text-[var(--pbp-text-muted)]"}`
          }
        >
          {getMemoDisplayContent(thread, ui.memo.deleted)}
        </div>
      )}

      {getVisibleMemoReplies(thread.replies ?? []).length > 0 || replyComposerOpen ? (
        <div className="mt-3 space-y-2 border-t border-[var(--pbp-border)] pt-3">
          {getVisibleMemoReplies(thread.replies ?? []).map((reply, replyIndex) => {
            const isEditingReply = editingReplyId === reply.id;
            return (
              <div
                key={`${thread.id}-${reply.id}-${replyIndex}`}
                className="min-w-0 pl-2 text-[var(--pbp-text-muted)] sm:pl-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 break-words text-[11px] leading-4 pbp-text-muted">
                    {ui.memo.replyMarker} {getMemoAuthorDisplayName(reply, users, ui.memo)} · {formatMemoTimestamp(reply.createdAt)}
                  </div>
                  <MemoItemActions
                    canMutate={canMutateAuthor(reply.authorId) && !writeLocked}
                    editLabel={ui.memo.edit}
                    deleteAriaLabel={ui.memo.deleteAria}
                    onEdit={() => startReplyEdit(reply)}
                    onDelete={() => onDeleteReply(thread.id, reply.id)}
                  />
                </div>
                {isEditingReply ? (
                  <WaflSurface
                    component="input-card"
                    shape="control"
                    tone="muted"
                    className="pbp-workorder-editable-panel mt-1.5 p-2"
                  >
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
                  </WaflSurface>
                ) : (
                  <div className="mt-0.5 break-words whitespace-pre-wrap text-[13px] leading-5">
                    {reply.content}
                  </div>
                )}
              </div>
            );
          })}

          {replyComposerOpen ? (
            <WaflSurface
              component="input-card"
              shape="control"
              tone="muted"
              className="pbp-workorder-editable-panel p-2.5"
            >
              <MemoInputField
                value={replyDraft}
                disabled={!canEditMemo || writeLocked || isThreadDeleted}
                placeholder={ui.memo.replyPlaceholder}
                submitLabel={ui.memo.submit}
                onChange={setReplyDraft}
                onSubmit={submitReply}
                isMobile={isMobile}
              />
            </WaflSurface>
          ) : null}
        </div>
      ) : null}
    </WaflSurface>
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
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLTextAreaElement
    )
      document.activeElement.blur();
    setThreadDraft("");
  };

  const isFlatDevice = isMobile || isTablet;
  const content = (
    <>
      {!isFlatDevice ? (
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h3 className="truncate text-sm font-semibold pbp-text-primary">
            {ui.memo.panelTitle}
          </h3>
          <SectionCountBadge>{`${memoThreads.length}${ui.memo.countSuffix}`}</SectionCountBadge>
        </div>
      ) : null}
      <WaflSurface
        component="input-card"
        shape="control"
        tone="muted"
        className={
          isMobile
            ? "pbp-workorder-editable-panel p-2"
            : isTablet
              ? "pbp-workorder-editable-panel p-2.5"
              : "pbp-workorder-editable-panel mt-3 p-2.5"
        }
      >
        <div className="text-[11px] pbp-text-muted">
          {ui.memo.authorPrefix}{" "}
          {getMemoAuthorDisplayName(
            {
              authorId: currentUserId,
              authorName: currentUserName,
              authorRole: currentUserRole,
            },
            users,
            ui.memo,
          )}
        </div>
        <div className="mt-2">
          <MemoInputField
            value={threadDraft}
            disabled={!canEditMemo || writeLocked}
            placeholder={ui.memo.threadPlaceholder}
            submitLabel={ui.memo.submit}
            onChange={setThreadDraft}
            onSubmit={submitThread}
            isMobile={isMobile}
          />
        </div>
      </WaflSurface>
      <div className={isMobile ? "mt-2.5 min-w-0 space-y-2.5" : "mt-3 min-w-0 space-y-3"}>
        {memoThreads.length > 0 ? (
          memoThreads.map((thread, threadIndex) => (
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
          ))
        ) : (
          <WaflEmptyCard shape="control" className={`${WAFL_WORKSPACE_EMPTY_CARD_CLASS} px-3 py-5`}>
            {ui.memo.empty}
          </WaflEmptyCard>
        )}
      </div>
    </>
  );

  return isFlatDevice ? (
    <div className="min-w-0 space-y-2.5">{content}</div>
  ) : (
    <WorkOrderPanelCard className="min-w-0">{content}</WorkOrderPanelCard>
  );
}
