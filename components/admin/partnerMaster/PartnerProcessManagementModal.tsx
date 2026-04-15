import StatusToggle from "@/components/common/StatusToggle";
import ModalShell from "@/components/common/modal/ModalShell";
import { type OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster";
import type { OutsourcingProcessType } from "@/types/partner";

type PartnerProcessManagementModalProps = {
  open: boolean;
  newProcessLabel: string;
  processFormError: string;
  orderedProcessDefinitions: OutsourcingProcessDefinition[];
  onClose: () => void;
  onResetDefaults: () => void;
  onNewProcessLabelChange: (value: string) => void;
  onAddProcessDefinition: () => void;
  onUpdateProcessDefinition: (
    type: OutsourcingProcessType,
    updater: (current: OutsourcingProcessDefinition) => OutsourcingProcessDefinition,
  ) => void;
  onRequestDelete: (type: OutsourcingProcessType) => void;
  onMove: (type: OutsourcingProcessType, direction: "up" | "down") => void;
  onClearProcessFormError: () => void;
};

export default function PartnerProcessManagementModal({
  open,
  newProcessLabel,
  processFormError,
  orderedProcessDefinitions,
  onClose,
  onResetDefaults,
  onNewProcessLabelChange,
  onAddProcessDefinition,
  onUpdateProcessDefinition,
  onRequestDelete,
  onMove,
  onClearProcessFormError,
}: PartnerProcessManagementModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="외주공정 관리"
      description="표시명, 사용 여부, 추가/삭제, 위아래 이동만으로 외주공정 목록을 간단하게 관리한다."
      maxWidthClass="md:max-w-3xl"
      bodyClassName="space-y-4"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={onResetDefaults}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            기본값 복원
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            닫기
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="min-w-0 flex-1 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">새 외주공정</span>
            <input
              value={newProcessLabel}
              onChange={(event) => {
                onNewProcessLabelChange(event.target.value);
                if (processFormError) onClearProcessFormError();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddProcessDefinition();
                }
              }}
              placeholder="공정명 입력"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </label>
          <button
            type="button"
            onClick={onAddProcessDefinition}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            추가
          </button>
        </div>
        {processFormError ? <p className="mt-2 text-sm font-medium text-rose-600">{processFormError}</p> : null}
      </div>

      <div className="space-y-3">
        {orderedProcessDefinitions.map((definition, index) => {
          const isFirst = index === 0;
          const isLast = index === orderedProcessDefinitions.length - 1;

          return (
            <div key={definition.type} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <label className="min-w-0 flex-1 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">표시명</span>
                  <input
                    value={definition.label}
                    onChange={(event) => {
                      onUpdateProcessDefinition(definition.type, (current) => ({ ...current, label: event.target.value }));
                      if (processFormError) onClearProcessFormError();
                    }}
                    placeholder="공정명 입력"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <div className="flex items-center gap-2">
                    <StatusToggle
                      checked={definition.isActive}
                      onChange={(nextValue) => onUpdateProcessDefinition(definition.type, (current) => ({ ...current, isActive: nextValue }))}
                      srLabel={`${definition.label} 사용 여부`}
                      size="sm"
                    />
                    <span className={`text-sm font-medium ${definition.isActive ? "text-stone-900" : "text-stone-500"}`}>
                      {definition.isActive ? "사용중" : "미사용"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRequestDelete(definition.type)}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    삭제
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onMove(definition.type, "up")}
                      disabled={isFirst}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`${definition.label} 위로 이동`}
                    >
                      <span className="block rotate-180">▾</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(definition.type, "down")}
                      disabled={isLast}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`${definition.label} 아래로 이동`}
                    >
                      <span className="block">▾</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
