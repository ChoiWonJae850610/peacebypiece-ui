"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { createModalActionHandler, renderModalFooterActions } from "@/components/common/modal/modalActions";

export default function AttachmentRequestModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, files: File[]) => void;
}) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) {
      setContent("");
      setFiles([]);
    }
  }, [open]);

  const handleSubmit = createModalActionHandler({
    action: () => onSubmit(content, files),
    onClose,
    closeAfterAction: true,
  });

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="첨부 요청 등록"
      description="관리자 검토 후 공식 첨부로 승격할 파일을 메모로 요청합니다."
      maxWidthClass="md:max-w-2xl"
      bodyClassName="bg-stone-50 p-4 md:p-6"
      footer={renderModalFooterActions({
        layout: "end",
        secondary: {
          label: "취소",
          onClick: onClose,
          className: "rounded-full",
        },
        primary: {
          label: "요청 등록",
          onClick: handleSubmit,
          tone: "primary",
          className: "rounded-full font-semibold",
        },
      })}
    >
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 md:p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">요청 메모</label>
          <textarea
            value={content}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setContent(event.target.value)}
            placeholder="예: 메인 시안 PDF 공식 첨부 승격 요청 / 공장 전달용 최신본입니다."
            className="min-h-[132px] w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">파일 첨부</label>
          <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600 transition hover:border-stone-400 hover:bg-stone-100">
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files ?? []))}
            />
            이미지 또는 PDF 선택
          </label>
          {files.length > 0 ? (
            <div className="mt-3 space-y-2">
              {files.map((file: File, index: number) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
                  <span className="truncate">{file.name}</span>
                  <span className="ml-3 shrink-0 rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-600">
                    {file.type.includes("pdf") ? "PDF" : "IMG"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-stone-500">파일 없이 요청 메모만 등록할 수도 있습니다.</div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
