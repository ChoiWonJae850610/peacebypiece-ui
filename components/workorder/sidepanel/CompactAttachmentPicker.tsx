"use client";

import { useI18n } from "@/lib/i18n";

export default function CompactAttachmentPicker({
  uploadedFiles,
  onFilesChange,
  onRemoveFile,
}: {
  uploadedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.attachmentPanel;

  return (
    <div className="flex items-start gap-2">
      <label className="pbp-interactive-button inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border border-stone-300 bg-white px-2.5 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200">
        {copy.compactAddButton}
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
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button type="button" onClick={() => onRemoveFile(index)} className="pbp-interactive-button text-stone-500 hover:text-rose-600" aria-label={`${file.name} ${copy.deleteAriaSuffix}`}>×</button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
