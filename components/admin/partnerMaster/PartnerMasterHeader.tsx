type PartnerMasterHeaderProps = {
  onOpenProcessModal: () => void;
  onOpenCreateModal: () => void;
};

export default function PartnerMasterHeader({ onOpenProcessModal, onOpenCreateModal }: PartnerMasterHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Master Data</p>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">기준정보 관리 · 거래처/공장 관리</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            공장, 원단, 부자재 거래처를 하나의 Partner master로 관리하고, 외주 여부와 가능 공정은 별도 속성으로 분리해 관리한다.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenProcessModal}
          className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          외주공정 관리
        </button>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          거래처/공장 등록
        </button>
      </div>
    </div>
  );
}
