"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_INPUT_CLASS, MODAL_SELECT_CLASS, MODAL_TEXTAREA_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { createModalActionHandler, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { useI18n } from "@/lib/i18n";



export default function AttachmentRequestModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, files: File[]) => void;
}) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;
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
      title={ui.modal.attachmentRequest.title}
      description={ui.modal.attachmentRequest.description}
      maxWidthClass="md:max-w-2xl"
      bodyClassName="bg-stone-50 p-4 md:p-6"
      footer={renderModalFooterActions({
        layout: "end",
        secondary: {
          label: ui.modal.attachmentRequest.cancel,
          onClick: onClose,
          className: "rounded-full",
        },
        primary: {
          label: ui.modal.attachmentRequest.submit,
          onClick: handleSubmit,
          tone: "primary",
          className: "rounded-full font-semibold",
        },
      })}
    >
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 md:p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">{ui.modal.attachmentRequest.memoLabel}</label>
          <textarea
            value={content}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setContent(event.target.value)}
            placeholder={ui.modal.attachmentRequest.memoPlaceholder}
            className={`min-h-[132px] ${MODAL_TEXTAREA_CLASS} resize-none rounded-2xl border-stone-200 bg-stone-50 py-3 text-stone-800`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">{ui.modal.attachmentRequest.fileLabel}</label>
          <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600 transition hover:border-stone-400 hover:bg-stone-100">
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files ?? []))}
            />
            {ui.modal.attachmentRequest.filePicker}
          </label>
          {files.length > 0 ? (
            <div className="mt-3 space-y-2">
              {files.map((file: File, index: number) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
                  <span className="truncate">{file.name}</span>
                  <span className="ml-3 shrink-0 rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-600">
                    {file.type.includes("pdf") ? ui.modal.attachmentRequest.pdfBadge : ui.modal.attachmentRequest.imageBadge}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-stone-500">{ui.modal.attachmentRequest.noFilesHelp}</div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
