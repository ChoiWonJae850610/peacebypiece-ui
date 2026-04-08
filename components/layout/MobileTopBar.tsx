"use client";

type Props = {
  version: string;
  onOpen: () => void;
  onOpenSettings: () => void;
};

export default function MobileTopBar({ version, onOpen, onOpenSettings }: Props) {
  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-3 py-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-stone-900">PeacebyPiece v{version}</div>
          <div className="text-[11px] text-stone-500">모바일 작업 메뉴</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="환경 설정 열기"
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            ⚙️
          </button>
          <button
            type="button"
            onClick={onOpen}
            aria-label="작업 목록 열기"
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            메뉴
          </button>
        </div>
      </div>
    </div>
  );
}
