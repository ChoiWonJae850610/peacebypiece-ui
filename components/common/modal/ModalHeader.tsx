"use client";

type ModalHeaderProps = {
  titleId: string;
  title: string;
  description?: string;
  onClose: () => void;
};

export default function ModalHeader({
  titleId,
  title,
  description,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-4 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div id={titleId} className="text-lg font-semibold text-stone-900">
            {title}
          </div>
          {description ? (
            <div className="mt-1 break-keep text-sm text-stone-500">
              {description}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 whitespace-nowrap rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
