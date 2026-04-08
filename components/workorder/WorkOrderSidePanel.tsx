"use client";

import { useState, type KeyboardEvent } from "react";
import { toDisplayValue } from "@/lib/utils/display";
import type { Attachment, HistoryFilter, HistoryLog, HistoryTone, MemoAttachmentPayload, MemoThread, WorkOrder } from "@/types/workorder";

function SummaryRow({ label, value, strong = false }: { label: string; value: string | number | null | undefined; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={strong ? "font-semibold text-stone-900" : "font-medium"}>{toDisplayValue(value)}</span>
    </div>
  );
}

function getHistoryToneClass(tone: HistoryTone) {
  switch (tone) {
    case "blue": return "bg-blue-100 text-blue-700";
    case "violet": return "bg-violet-100 text-violet-700";
    case "emerald": return "bg-emerald-100 text-emerald-700";
    case "rose": return "bg-rose-100 text-rose-700";
    case "amber": return "bg-amber-100 text-amber-700";
    default: return "bg-stone-100 text-stone-700";
  }
}

function HistoryPreviewItem({ item }: { item: HistoryLog }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getHistoryToneClass(item.tone)}`}>{item.action}</div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{item.time}</span>
            {hasDetails && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">{open ? "접기" : "상세"}</span>}
          </div>
        </div>
        <div className="mt-2 text-xs text-stone-500">{item.user}</div>
        <div className="mt-1 text-sm text-stone-700">{item.message}</div>
      </button>

      {hasDetails && open && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {item.transition && (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {item.transition.from} <span className="px-1 text-stone-400">→</span> {item.transition.to}
            </div>
          )}
          {item.detailLines?.map((detail, index) => (
            <div key={`${item.id}-detail-${index}`} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
              <span>
                {detail.label ? <span className="font-medium text-stone-900">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentPanel({
  canSeeAttachments,
  canUploadOfficialAttachments,
  attachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
}: {
  canSeeAttachments: boolean;
  canUploadOfficialAttachments: boolean;
  attachments: Attachment[];
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
}) {
  if (!canSeeAttachments) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">공식 첨부파일</h3>
        </div>
        {canUploadOfficialAttachments ? (
          <button type="button" onClick={onOpenAttachmentPicker} className="pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200">+ 첨부 추가</button>
        ) : null}
      </div>
      {attachments.length > 0 ? (
        <div className="mt-2.5 space-y-2">
          {attachments.map((attachment) => {
            const canDelete = canDeleteAttachment(attachment);

            return (
              <div key={attachment.id} className="relative rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-12">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => onDeleteAttachment(attachment.id)}
                    className="pbp-interactive-button absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                    aria-label={`${attachment.name} 삭제`}
                    title="삭제"
                  >
                    ×
                  </button>
                ) : null}
                <button type="button" onClick={() => onPreviewAttachment(attachment.id)} className="flex w-full items-center gap-3 text-left">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {attachment.type === "image" ? (
                      <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-rose-700">PDF</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate pr-2 text-sm font-medium text-stone-900">{attachment.name}</div>
                    <div className="mt-1 text-xs text-stone-500">{attachment.ownerName ?? "기존 첨부"}</div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">아직 공식 첨부파일이 없습니다.</div>
      )}
    </div>
  );
}


function CompactAttachmentPicker({
  uploadedFiles,
  onFilesChange,
  onRemoveFile,
}: {
  uploadedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <label className="pbp-interactive-button inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border border-stone-300 bg-white px-2.5 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200">
        첨부추가
        <input
          type="file"
          multiple
          accept="image/*,.pdf,application/pdf"
          className="sr-only"
          onChange={(event) => onFilesChange([...(uploadedFiles ?? []), ...Array.from<File>(event.target.files ?? [])])}
        />
      </label>
      {uploadedFiles.length > 0 ? (
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 pt-0.5">
          {uploadedFiles.map((file, index) => (
            <span key={`${file.name}-${file.size}-${index}`} className="inline-flex max-w-full items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-700">
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button type="button" onClick={() => onRemoveFile(index)} className="pbp-interactive-button text-stone-500 hover:text-rose-600" aria-label={`${file.name} 삭제`}>×</button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MemoAttachmentList({
  attachmentIds,
  attachmentsById,
  canPromoteMemoAttachment = false,
  onPromoteMemoAttachment,
  onPreviewAttachment,
}: {
  attachmentIds?: string[];
  attachmentsById: Map<string, Attachment>;
  canPromoteMemoAttachment?: boolean;
  onPromoteMemoAttachment?: (attachmentId: string) => void;
  onPreviewAttachment?: (attachmentId: string) => void;
}) {
  const linkedAttachments = (attachmentIds ?? []).map((attachmentId) => attachmentsById.get(attachmentId)).filter((attachment): attachment is Attachment => Boolean(attachment));
  if (linkedAttachments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {linkedAttachments.map((attachment) => {
        const isOfficial = (attachment.scope ?? "official") === "official";
        return (
          <div key={attachment.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-700">
            <button
              type="button"
              onClick={() => onPreviewAttachment?.(attachment.id)}
              className="flex min-w-0 max-w-full items-center gap-1.5 text-left"
            >
              <span className="font-semibold text-stone-900">{attachment.type === "pdf" ? "PDF" : "IMG"}</span>
              <span className="max-w-[160px] truncate">{attachment.name}</span>
            </button>
            {!isOfficial && canPromoteMemoAttachment && onPromoteMemoAttachment ? (
              <button type="button" onClick={() => onPromoteMemoAttachment(attachment.id)} className="pbp-interactive-button shrink-0 rounded-full border border-stone-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200">승격</button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MemoThreadCard({
  thread,
  attachmentsById,
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
  onPreviewAttachment,
  onCreateReply,
}: {
  thread: MemoThread;
  attachmentsById: Map<string, Attachment>;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onCreateReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
}) {
  const [replyDraft, setReplyDraft] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);

  const submitReply = () => {
    if (!replyDraft.trim()) return;
    onCreateReply(thread.id, replyDraft, { files: uploadedFiles });
    setReplyDraft("");
    setUploadedFiles([]);
    setReplyComposerOpen(false);
  };

  const onReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitReply();
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-stone-900">{thread.authorName}</div>
          <div className="mt-0.5 text-[11px] text-stone-500">{thread.authorRole} · {thread.createdAt}</div>
        </div>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-5 text-stone-700">{thread.content}</div>
      <MemoAttachmentList attachmentIds={thread.attachmentIds} attachmentsById={attachmentsById} canPromoteMemoAttachment={canPromoteMemoAttachment} onPromoteMemoAttachment={onPromoteMemoAttachment} onPreviewAttachment={onPreviewAttachment} />

      <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
        {(thread.replies ?? []).length > 0 ? thread.replies.map((reply) => (
          <div key={reply.id} className="pl-3 text-sm text-stone-700">
            <div className="text-[11px] text-stone-500">ㄴ {reply.authorName} · {reply.authorRole} · {reply.createdAt}</div>
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
            {replyComposerOpen ? "댓글 닫기" : "댓글"}
          </button>
        </div>

        {replyComposerOpen ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <textarea
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              onKeyDown={onReplyKeyDown}
              placeholder="댓글 입력"
              className="pbp-field-interaction min-h-[36px] w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50"
            />
            <div className="mt-2 flex items-start justify-between gap-2">
              <CompactAttachmentPicker uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} onRemoveFile={(index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))} />
              <button type="button" onClick={submitReply} className="pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black">등록</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MemoPanel({
  workOrder,
  currentUserName,
  currentUserRole,
  onCreateThread,
  onCreateReply,
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
  onPreviewAttachment,
}: {
  workOrder: WorkOrder;
  currentUserName: string;
  currentUserRole: string;
  onCreateThread: (content: string, payload?: MemoAttachmentPayload) => void;
  onCreateReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
  onPreviewAttachment: (attachmentId: string) => void;
}) {
  const [threadDraft, setThreadDraft] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const memoThreads = workOrder.memoThreads ?? [];
  const attachmentsById = new Map((workOrder.attachments ?? []).map((attachment) => [attachment.id, attachment]));

  const submitThread = () => {
    if (!threadDraft.trim()) return;
    onCreateThread(threadDraft, { files: uploadedFiles });
    setThreadDraft('');
    setUploadedFiles([]);
  };

  const onThreadKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitThread();
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">작업메모</h3>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{memoThreads.length}개</span>
      </div>
      <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
        <div className="text-[11px] text-stone-500">{currentUserName} · {currentUserRole}</div>
        <textarea
          value={threadDraft}
          onChange={(event) => setThreadDraft(event.target.value)}
          onKeyDown={onThreadKeyDown}
          placeholder="작업 메모 입력"
          className="pbp-field-interaction mt-2 min-h-[38px] w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-stone-800 outline-none focus:border-stone-400 focus:bg-stone-50"
        />
        <div className="mt-2 flex items-start justify-between gap-2">
          <CompactAttachmentPicker uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} onRemoveFile={(index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))} />
          <button type="button" onClick={submitThread} className="pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 active:bg-black">등록</button>
        </div>
      </div>
      <div className="mt-2.5 space-y-2">
        {memoThreads.length > 0 ? memoThreads.map((thread) => (
          <MemoThreadCard key={thread.id} thread={thread} attachmentsById={attachmentsById} canPromoteMemoAttachment={canPromoteMemoAttachment} onPromoteMemoAttachment={onPromoteMemoAttachment} onPreviewAttachment={onPreviewAttachment} onCreateReply={onCreateReply} />
        )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-5 text-center text-sm text-stone-500">등록된 작업 메모가 없습니다.</div>}
      </div>
    </div>
  );
}

export default function WorkOrderSidePanel({
  canSeeAttachments,
  canUploadOfficialAttachments,
  attachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
  canSeeInventoryHistorySection,
  isAdmin,
  currentRole,
  filteredHistoryLogs,
  historyFilter,
  onHistoryFilterChange,
  onOpenInventoryLogModal,
  workOrder,
  currentUserName,
  onCreateMemoThread,
  onCreateMemoReply,
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
}: {
  canSeeAttachments: boolean;
  canUploadOfficialAttachments: boolean;
  attachments: Attachment[];
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
  canSeeInventoryHistorySection: boolean;
  isAdmin: boolean;
  currentRole: string;
  filteredHistoryLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
  onOpenInventoryLogModal: () => void;
  workOrder: WorkOrder;
  currentUserName: string;
  onCreateMemoThread: (content: string, payload?: MemoAttachmentPayload) => void;
  onCreateMemoReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
}) {
  return (
    <div className="space-y-3 md:space-y-4">
      <AttachmentPanel
        canSeeAttachments={canSeeAttachments}
        canUploadOfficialAttachments={canUploadOfficialAttachments}
        attachments={attachments}
        onOpenAttachmentPicker={onOpenAttachmentPicker}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
        canDeleteAttachment={canDeleteAttachment}
      />

      <MemoPanel
        workOrder={workOrder}
        currentUserName={currentUserName}
        currentUserRole={currentRole}
        onCreateThread={onCreateMemoThread}
        onCreateReply={onCreateMemoReply}
        canPromoteMemoAttachment={canPromoteMemoAttachment}
        onPromoteMemoAttachment={onPromoteMemoAttachment}
        onPreviewAttachment={onPreviewAttachment}
      />

      {canSeeInventoryHistorySection && isAdmin && (
        <div className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">히스토리</h3>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{filteredHistoryLogs.length}건</span>
          </div>
          {isAdmin && (
            <div className="mt-3 flex flex-wrap gap-2">
              {([ ["all", "전체"], ["work", "작업"], ["inventory", "재고"], ["attachment", "첨부"] ] as [HistoryFilter, string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => onHistoryFilterChange(value)} className={`pbp-touch-target pbp-interactive-button rounded-full px-3 py-1 text-xs font-medium ${historyFilter === value ? "bg-stone-900 text-white hover:bg-stone-800 active:bg-black" : "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200"}`}>{label}</button>
              ))}
            </div>
          )}
          <div className="mt-2.5 space-y-2">
            {filteredHistoryLogs.length > 0 ? filteredHistoryLogs.map((item) => (
              <HistoryPreviewItem key={item.id} item={item} />
            )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">표시할 히스토리가 없습니다.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
