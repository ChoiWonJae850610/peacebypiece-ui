"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import WorkOrderPanelCard from "@/components/common/ui/WorkOrderPanelCard";
import { useI18n } from "@/lib/i18n";
import type { MemoThread, RoleType, WorkOrder } from "@/types/workorder";

function getRoleDisplayLabel(role: RoleType, i18n: ReturnType<typeof useI18n>["i18n"]) {
  return i18n.common.ui.roles?.[role] ?? role;
}

function MemoThreadCard({
  thread,
  onCreateReply,
  canEditMemo,
  workOrderId,
  variant = "desktop",
}: {
  thread: MemoThread;
  onCreateReply: (threadId: string, content: string) => void;
  canEditMemo: boolean;
  workOrderId: string;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const isMobile = variant === "mobile";
  const [replyDraft, setReplyDraft] = useState("");
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);

  useEffect(() => {
    setReplyDraft("");
    setReplyComposerOpen(false);
  }, [thread.id, workOrderId]);

  const submitReply = () => {
    if (!canEditMemo || !replyDraft.trim()) return;
    onCreateReply(thread.id, replyDraft);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur();
    }
    setReplyDraft("");
    setReplyComposerOpen(false);
  };

  const onReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitReply();
    }
  };

  return (
    <div className={isMobile ? "rounded-2xl border border-stone-200 bg-white p-2.5 shadow-sm" : "rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={isMobile ? "truncate text-[13px] font-semibold text-stone-900" : "truncate text-sm font-semibold text-stone-900"}>{thread.authorName}</div>
          <div className="mt-0.5 text-[11px] text-stone-500">{getRoleDisplayLabel(thread.authorRole, i18n)} · {thread.createdAt}</div>
        </div>
      </div>
      <div className={isMobile ? "mt-2 whitespace-pre-wrap text-[13px] leading-5 text-stone-700" : "mt-2 whitespace-pre-wrap text-sm leading-5 text-stone-700"}>{thread.content}</div>

      <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
        {(thread.replies ?? []).length > 0 ? thread.replies.map((reply) => (
          <div key={reply.id} className="pl-3 text-sm text-stone-700">
            <div className="text-[11px] text-stone-500">ㄴ {reply.authorName} · {getRoleDisplayLabel(reply.authorRole, i18n)} · {reply.createdAt}</div>
            <div className="mt-0.5 whitespace-pre-wrap leading-5">{reply.content}</div>
          </div>
        )) : null}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setReplyComposerOpen((prev) => !prev)}
            disabled={!canEditMemo}
            className="pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {replyComposerOpen ? ui.memo.toggleReplyClose : ui.memo.toggleReplyOpen}
          </button>
        </div>

        {replyComposerOpen ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <textarea
              rows={1}
              value={replyDraft}
              disabled={!canEditMemo}
              onChange={(event) => setReplyDraft(event.target.value)}
              onKeyDown={onReplyKeyDown}
              placeholder={ui.memo.replyPlaceholder}
              className="pbp-field-interaction h-[32px] w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 md:text-sm"
            />
            <div className={isMobile ? "mt-2" : "mt-2 flex justify-end"}>
              <button type="button" onClick={submitReply} disabled={!canEditMemo || !replyDraft.trim()} className={isMobile ? "pbp-interactive-button w-full rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50" : "pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"}>{ui.memo.submit}</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function WorkOrderMemoPanel({
  workOrder,
  currentUserName,
  currentUserRole,
  onCreateThread,
  onCreateReply,
  canEditMemo,
  variant = "desktop",
}: {
  workOrder: WorkOrder;
  currentUserName: string;
  currentUserRole: RoleType;
  onCreateThread: (content: string) => void;
  onCreateReply: (threadId: string, content: string) => void;
  canEditMemo: boolean;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const isMobile = variant === "mobile";
  const isTablet = variant === "tablet";
  const [threadDraft, setThreadDraft] = useState("");
  const memoThreads = workOrder.memoThreads ?? [];

  useEffect(() => {
    setThreadDraft("");
  }, [workOrder.id]);

  const submitThread = () => {
    if (!canEditMemo || !threadDraft.trim()) return;
    onCreateThread(threadDraft);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur();
    }
    setThreadDraft("");
  };

  const onThreadKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitThread();
    }
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
          <textarea
            rows={1}
            value={threadDraft}
            disabled={!canEditMemo}
            onChange={(event) => setThreadDraft(event.target.value)}
            onKeyDown={onThreadKeyDown}
            placeholder={ui.memo.threadPlaceholder}
            className={isMobile
              ? "pbp-field-interaction h-[34px] w-full resize-none overflow-hidden rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              : "pbp-field-interaction h-[32px] w-full resize-none overflow-hidden rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 md:text-sm"}
          />
        </div>
        <div className={isMobile ? "mt-2" : "mt-2 flex justify-end"}>
          <button type="button" onClick={submitThread} disabled={!canEditMemo || !threadDraft.trim()} className={isMobile ? "pbp-interactive-button w-full rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50" : "pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"}>{ui.memo.submit}</button>
        </div>
      </div>
      <div className={isMobile ? "mt-2.5 space-y-1.5" : "mt-2.5 space-y-2"}>
        {memoThreads.length > 0 ? memoThreads.map((thread) => (
          <MemoThreadCard key={`${workOrder.id}-${thread.id}`} thread={thread} onCreateReply={onCreateReply} workOrderId={workOrder.id} variant={variant} canEditMemo={canEditMemo} />
        )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-5 text-center text-sm text-stone-500">{ui.memo.empty}</div>}
      </div>
    </WorkOrderPanelCard>
  );
}
