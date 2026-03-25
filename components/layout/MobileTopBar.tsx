"use client";

type Props = {
  version: string;
  onOpen: () => void;
};

export default function MobileTopBar({ version, onOpen }: Props) {
  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-stone-900">PeacebyPiece v{version}</div>
          <div className="text-[11px] text-stone-500">모바일 작업 메뉴</div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          aria-label="작업 목록 열기"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm"
        >
          메뉴
        </button>
      </div>
    </div>
  );
}
