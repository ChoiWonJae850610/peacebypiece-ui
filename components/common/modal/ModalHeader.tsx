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
    <div className="sticky top-0 z-20 shrink-0 border-b border-stone-200 bg-white/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur md:px-6 md:pb-4 md:pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div id={titleId} className="text-base font-semibold text-stone-900 md:text-lg">
            {title}
          </div>
          {description ? <div className="mt-1 break-keep text-sm text-stone-500">{description}</div> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 whitespace-nowrap rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition active:scale-[0.97]"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
