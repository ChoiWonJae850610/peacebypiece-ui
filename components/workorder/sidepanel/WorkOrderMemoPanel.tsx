"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import WorkOrderPanelCard from "@/components/common/ui/WorkOrderPanelCard";
import { useI18n } from "@/lib/i18n";

import CompactAttachmentPicker from "@/components/workorder/sidepanel/CompactAttachmentPicker";
import MemoAttachmentList from "@/components/workorder/sidepanel/MemoAttachmentList";
import type { Attachment, MemoAttachmentPayload, MemoThread, RoleType, WorkOrder } from "@/types/workorder";

function getRoleDisplayLabel(role: RoleType, i18n: ReturnType<typeof useI18n>["i18n"]) {
  return i18n.common.ui.roles?.[role] ?? role;
}

function MemoThreadCard({
  thread,
  attachmentsById,
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
  onPreviewAttachment,
  onCreateReply,
  workOrderId,
  variant = "desktop",
}: {
  thread: MemoThread;
  attachmentsById: Map<string, Attachment>;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onCreateReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  workOrderId: string;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const isMobile = variant === "mobile";
  const [replyDraft, setReplyDraft] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);

  useEffect(() => {
    setReplyDraft("");
    setUploadedFiles([]);
    setReplyComposerOpen(false);
  }, [thread.id, workOrderId]);

  const submitReply = () => {
    if (!replyDraft.trim()) return;
    onCreateReply(thread.id, replyDraft, { files: uploadedFiles });
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur();
    }
    setReplyDraft("");
    setUploadedFiles([]);
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
      <MemoAttachmentList attachmentIds={thread.attachmentIds} attachmentsById={attachmentsById} canPromoteMemoAttachment={canPromoteMemoAttachment} onPromoteMemoAttachment={onPromoteMemoAttachment} onPreviewAttachment={onPreviewAttachment} />

      <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
        {(thread.replies ?? []).length > 0 ? thread.replies.map((reply) => (
          <div key={reply.id} className="pl-3 text-sm text-stone-700">
            <div className="text-[11px] text-stone-500">ㄴ {reply.authorName} · {getRoleDisplayLabel(reply.authorRole, i18n)} · {reply.createdAt}</div>
            <div className="mt-0.5 whitespace-pre-wrap leading-5">{reply.content}</div>
            <MemoAttachmentList attachmentIds={reply.attachmentIds} attachmentsById={attachmentsById} canPromoteMemoAttachment={canPromoteMemoAttachment} onPromoteMemoAttachment={onPromoteMemoAttachment} onPreviewAttachment={onPreviewAttachment} />
          </div>
        )) : null}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setReplyComposerOpen((prev) => !prev)}
            className="pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200"
          >
            {replyComposerOpen ? ui.memo.toggleReplyClose : ui.memo.toggleReplyOpen}
          </button>
        </div>

        {replyComposerOpen ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <textarea
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              onKeyDown={onReplyKeyDown}
              placeholder={ui.memo.replyPlaceholder}
              className="pbp-field-interaction min-h-[36px] w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 md:text-sm"
            />
            <div className={isMobile ? "mt-2 space-y-2" : "mt-2 flex items-start justify-between gap-2"}>
              <CompactAttachmentPicker uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} onRemoveFile={(index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))} />
              <button type="button" onClick={submitReply} className={isMobile ? "pbp-interactive-button w-full rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 active:bg-black" : "pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black"}>{ui.memo.submit}</button>
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
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
  onPreviewAttachment,
  variant = "desktop",
}: {
  workOrder: WorkOrder;
  currentUserName: string;
  currentUserRole: RoleType;
  onCreateThread: (content: string, payload?: MemoAttachmentPayload) => void;
  onCreateReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const isMobile = variant === "mobile";
  const isTablet = variant === "tablet";
  const [threadDraft, setThreadDraft] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const memoThreads = workOrder.memoThreads ?? [];

  useEffect(() => {
    setThreadDraft("");
    setUploadedFiles([]);
  }, [workOrder.id]);
  const attachmentsById = new Map((workOrder.attachments ?? []).map((attachment) => [attachment.id, attachment]));

  const submitThread = () => {
    if (!threadDraft.trim()) return;
    onCreateThread(threadDraft, { files: uploadedFiles });
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur();
    }
    setThreadDraft("");
    setUploadedFiles([]);
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
        <textarea
          value={threadDraft}
          onChange={(event) => setThreadDraft(event.target.value)}
          onKeyDown={onThreadKeyDown}
          placeholder={ui.memo.threadPlaceholder}
          className={isMobile ? "pbp-field-interaction mt-2 min-h-[72px] w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50" : "pbp-field-interaction mt-2 min-h-[38px] w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-base text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50 md:text-sm"}
        />
        <div className={isMobile ? "mt-2 space-y-2" : "mt-2 flex items-start justify-between gap-2"}>
          <CompactAttachmentPicker uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} onRemoveFile={(index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))} />
          <button type="button" onClick={submitThread} className={isMobile ? "pbp-interactive-button w-full rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 active:bg-black" : "pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black"}>{ui.memo.submit}</button>
        </div>
      </div>
      <div className={isMobile ? "mt-2.5 space-y-1.5" : "mt-2.5 space-y-2"}>
        {memoThreads.length > 0 ? memoThreads.map((thread) => (
          <MemoThreadCard key={`${workOrder.id}-${thread.id}`} thread={thread} attachmentsById={attachmentsById} canPromoteMemoAttachment={canPromoteMemoAttachment} onPromoteMemoAttachment={onPromoteMemoAttachment} onPreviewAttachment={onPreviewAttachment} onCreateReply={onCreateReply} workOrderId={workOrder.id} variant={variant} />
        )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-5 text-center text-sm text-stone-500">{ui.memo.empty}</div>}
      </div>
    </WorkOrderPanelCard>
  );
}
