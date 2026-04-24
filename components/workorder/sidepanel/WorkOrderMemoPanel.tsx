"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import WorkOrderPanelCard from "@/components/common/ui/WorkOrderPanelCard";
import { useI18n } from "@/lib/i18n";
import { getMemoDisplayContent, getVisibleMemoReplies, getVisibleMemoThreads, isDeletedMemoItem } from "@/lib/workorder/presentation/memoPresentation";
import type { MemoReply, MemoThread, RoleType, WorkOrder } from "@/types/workorder";

const MEMO_MAX_LENGTH = 50;
function getRoleDisplayLabel(role: RoleType, i18n: ReturnType<typeof useI18n>["i18n"]) {
  return i18n.common.ui.roles?.[role] ?? role;
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
    <div>
      <textarea
        rows={1}
        maxLength={MEMO_MAX_LENGTH}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeMemoInput(event.target.value))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={isMobile
          ? "pbp-field-interaction h-[34px] w-full resize-none overflow-hidden rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          : "pbp-field-interaction h-[32px] w-full resize-none overflow-hidden rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 md:text-sm"}
      />
      <div className={isMobile ? "mt-1.5 flex items-center justify-between gap-2" : "mt-1.5 flex items-center justify-end gap-2"}>
        <span className="mr-auto text-[10px] font-medium text-stone-400">{`${value.length} / ${MEMO_MAX_LENGTH}`}</span>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 active:bg-stone-200">
            {cancelLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !trimmed}
          className={isMobile
            ? "pbp-interactive-button rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            : "pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"}
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

function MemoItemActions({ canMutate, editLabel, deleteAriaLabel, onEdit, onDelete }: { canMutate: boolean; editLabel: string; deleteAriaLabel: string; onEdit: () => void; onDelete: () => void }) {
  if (!canMutate) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
        className="pbp-interactive-button inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-600 hover:border-amber-400 hover:bg-amber-50 active:bg-amber-100"
      >
        <MemoPencilIcon />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteAriaLabel}
        title={deleteAriaLabel}
        className="pbp-interactive-button inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-200 bg-white text-[13px] font-semibold leading-none text-red-500 hover:bg-red-50 active:bg-red-100"
      >
        -
      </button>
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
  currentUserId,
  currentUserRole,
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
  currentUserId: string;
  currentUserRole: RoleType;
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
  const canMutateThread = canMutateAuthor(thread.authorId) && !isThreadDeleted;

  const submitReply = () => {
    const nextContent = replyDraft.trim();
    if (!canEditMemo || isThreadDeleted || !nextContent) return;
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
    <div className={isMobile ? "rounded-2xl border border-stone-200 bg-white p-2.5 shadow-sm" : "rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={isMobile ? "truncate text-[13px] font-semibold text-stone-900" : "truncate text-sm font-semibold text-stone-900"}>{thread.authorName}</div>
          <div className="mt-0.5 text-[11px] text-stone-500">{getRoleDisplayLabel(thread.authorRole, i18n)} · {thread.createdAt}</div>
        </div>
        <MemoItemActions
          canMutate={canMutateThread}
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
        <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-2">
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
          ? `mt-2 whitespace-pre-wrap text-[12px] leading-5 ${isThreadDeleted ? "italic text-stone-400" : "text-stone-700"}`
          : `mt-2 whitespace-pre-wrap text-[13px] leading-5 ${isThreadDeleted ? "italic text-stone-400" : "text-stone-700"}`
        }>{getMemoDisplayContent(thread, ui.memo.deleted)}</div>
      )}

      <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
        {getVisibleMemoReplies(thread.replies ?? []).length > 0 ? getVisibleMemoReplies(thread.replies ?? []).map((reply) => {
          const isEditingReply = editingReplyId === reply.id;
          return (
            <div key={reply.id} className="pl-3 text-stone-700">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-[11px] text-stone-500">ㄴ {reply.authorName} · {getRoleDisplayLabel(reply.authorRole, i18n)} · {reply.createdAt}</div>
                <MemoItemActions canMutate={canMutateAuthor(reply.authorId)} editLabel={ui.memo.edit} deleteAriaLabel={ui.memo.deleteAria} onEdit={() => startReplyEdit(reply)} onDelete={() => onDeleteReply(thread.id, reply.id)} />
              </div>
              {isEditingReply ? (
                <div className="mt-1.5 rounded-xl border border-stone-200 bg-stone-50 p-2">
                  <MemoInputField
                    value={replyEditDraft}
                    disabled={!canMutateAuthor(reply.authorId)}
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
                <div className="mt-0.5 whitespace-pre-wrap text-[13px] leading-5">{reply.content}</div>
              )}
            </div>
          );
        }) : null}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button type="button" onClick={() => setReplyComposerOpen((prev) => !prev)} disabled={!canEditMemo || isThreadDeleted} className="pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50">
            {replyComposerOpen ? ui.memo.toggleReplyClose : ui.memo.toggleReplyOpen}
          </button>
        </div>

        {replyComposerOpen ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <MemoInputField value={replyDraft} disabled={!canEditMemo || isThreadDeleted} placeholder={ui.memo.replyPlaceholder} submitLabel={ui.memo.submit} onChange={setReplyDraft} onSubmit={submitReply} isMobile={isMobile} />
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
  onCreateThread,
  onCreateReply,
  onUpdateThread,
  onDeleteThread,
  onUpdateReply,
  onDeleteReply,
  canEditMemo,
  variant = "desktop",
}: {
  workOrder: WorkOrder;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: RoleType;
  onCreateThread: (content: string) => void;
  onCreateReply: (threadId: string, content: string) => void;
  onUpdateThread: (threadId: string, content: string) => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateReply: (threadId: string, replyId: string, content: string) => void;
  onDeleteReply: (threadId: string, replyId: string) => void;
  canEditMemo: boolean;
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
    if (!canEditMemo || !nextContent) return;
    onCreateThread(nextContent);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) document.activeElement.blur();
    setThreadDraft("");
  };

  return (
    <WorkOrderPanelCard>
      <div className={isMobile ? "flex items-center justify-between gap-2" : "flex items-center justify-between gap-3"}>
        <h3 className="text-sm font-semibold text-stone-900">{ui.memo.panelTitle}</h3>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{`${memoThreads.length}${ui.memo.countSuffix}`}</span>
      </div>
      <div className={isMobile ? "mt-2.5 rounded-xl border border-stone-200 bg-stone-50 p-2" : isTablet ? "mt-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5" : "mt-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5"}>
        <div className="text-[11px] text-stone-500">{currentUserName} · {getRoleDisplayLabel(currentUserRole, i18n)}</div>
        <div className="mt-2">
          <MemoInputField value={threadDraft} disabled={!canEditMemo} placeholder={ui.memo.threadPlaceholder} submitLabel={ui.memo.submit} onChange={setThreadDraft} onSubmit={submitThread} isMobile={isMobile} />
        </div>
      </div>
      <div className={isMobile ? "mt-2.5 space-y-1.5" : "mt-2.5 space-y-2"}>
        {memoThreads.length > 0 ? memoThreads.map((thread) => (
          <MemoThreadCard
            key={`${workOrder.id}-${thread.id}`}
            thread={thread}
            onCreateReply={onCreateReply}
            onUpdateThread={onUpdateThread}
            onDeleteThread={onDeleteThread}
            onUpdateReply={onUpdateReply}
            onDeleteReply={onDeleteReply}
            workOrderId={workOrder.id}
            variant={variant}
            canEditMemo={canEditMemo}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-5 text-center text-sm text-stone-500">{ui.memo.empty}</div>}
      </div>
    </WorkOrderPanelCard>
  );
}
