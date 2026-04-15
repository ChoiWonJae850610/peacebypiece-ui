import StatusToggle from "@/components/common/StatusToggle";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  BASE_PARTNER_TYPE_VALUES,
  PARTNER_TYPE_META,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { formatPhoneNumber } from "@/lib/utils/phoneFormat";
import type { OutsourcingProcessType, PartnerDraft } from "@/types/partner";

type PartnerMasterFormModalProps = {
  open: boolean;
  editingPartnerId: string | null;
  draft: PartnerDraft;
  formError: string;
  selectedPrimaryTypes: BasePartnerType[];
  isOutsourcingEnabled: boolean;
  availableProcessDefinitions: OutsourcingProcessDefinition[];
  assignedProcessDefinitions: OutsourcingProcessDefinition[];
  selectedAvailableProcess: OutsourcingProcessType | null;
  selectedAssignedProcess: OutsourcingProcessType | null;
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (updater: (current: PartnerDraft) => PartnerDraft) => void;
  onSetPrimaryType: (type: BasePartnerType) => void;
  onSetOutsourcingEnabled: (enabled: boolean) => void;
  onToggleOutsourcingProcess: (type: OutsourcingProcessType) => void;
  onOpenProcessModal: () => void;
  onSelectAvailableProcess: (type: OutsourcingProcessType | null) => void;
  onSelectAssignedProcess: (type: OutsourcingProcessType | null) => void;
};

export default function PartnerMasterFormModal({
  open,
  editingPartnerId,
  draft,
  formError,
  selectedPrimaryTypes,
  isOutsourcingEnabled,
  availableProcessDefinitions,
  assignedProcessDefinitions,
  selectedAvailableProcess,
  selectedAssignedProcess,
  onClose,
  onSubmit,
  onDraftChange,
  onSetPrimaryType,
  onSetOutsourcingEnabled,
  onToggleOutsourcingProcess,
  onOpenProcessModal,
  onSelectAvailableProcess,
  onSelectAssignedProcess,
}: PartnerMasterFormModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={editingPartnerId ? "거래처/공장 수정" : "거래처/공장 등록"}
      description="Partner master 기준으로 업체명, 대표자, 연락처, 기본 거래 유형, 외주 여부를 관리한다."
      maxWidthClass="md:max-w-2xl"
      bodyClassName="space-y-5"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-xs text-rose-600">{formError}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              저장
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="partner-name" className="text-sm font-medium text-stone-800">업체명</label>
          <input
            id="partner-name"
            value={draft.name}
            onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))}
            placeholder="업체명 입력"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-800">사용 여부</p>
          <div className="flex min-h-[48px] items-center gap-3">
            <StatusToggle
              checked={draft.isActive}
              onChange={(nextValue) => onDraftChange((current) => ({ ...current, isActive: nextValue }))}
              srLabel="거래처 사용 여부"
              size="sm"
            />
            <span className={`text-sm font-medium ${draft.isActive ? "text-stone-900" : "text-stone-500"}`}>
              {draft.isActive ? "사용중" : "미사용"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="partner-contact-name" className="text-sm font-medium text-stone-800">대표자</label>
          <input
            id="partner-contact-name"
            value={draft.contactName}
            onChange={(event) => onDraftChange((current) => ({ ...current, contactName: event.target.value }))}
            placeholder="대표자 이름 입력"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="partner-phone" className="text-sm font-medium text-stone-800">연락처</label>
          <input
            id="partner-phone"
            type="tel"
            value={draft.phone}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => onDraftChange((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }))}
            placeholder="000-0000-0000"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="partner-email" className="text-sm font-medium text-stone-800">이메일</label>
          <input
            id="partner-email"
            type="email"
            value={draft.email}
            onChange={(event) => onDraftChange((current) => ({ ...current, email: event.target.value }))}
            placeholder="이메일 입력"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-800">기본 거래 유형</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {BASE_PARTNER_TYPE_VALUES.map((type) => {
              const checked = selectedPrimaryTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSetPrimaryType(type)}
                  aria-pressed={checked}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                    checked ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-800 hover:border-stone-400",
                  ].join(" ")}
                >
                  {PARTNER_TYPE_META[type].shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-stone-800">외주 여부</p>
              <p className="text-xs leading-5 text-stone-500">외주 협력사라면 공정을 연결해 작업지시서에서 바로 필터링할 수 있게 준비한다.</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusToggle checked={isOutsourcingEnabled} onChange={onSetOutsourcingEnabled} srLabel="외주 여부" size="sm" />
              <span className={`text-sm font-medium ${isOutsourcingEnabled ? "text-stone-900" : "text-stone-500"}`}>
                {isOutsourcingEnabled ? "외주 사용" : "외주 미사용"}
              </span>
            </div>
          </div>
        </div>

        {isOutsourcingEnabled ? (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-stone-800">외주 공정 선택</p>
                <p className="text-xs leading-5 text-stone-500">좌측 목록에서 공정을 골라 우측 선택 목록으로 이동한다.</p>
              </div>
              <button
                type="button"
                onClick={onOpenProcessModal}
                className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
              >
                외주공정 관리
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">사용 가능 공정</p>
                <div className="min-h-[220px] rounded-2xl border border-stone-200 bg-stone-50 p-2">
                  {availableProcessDefinitions.length === 0 ? (
                    <div className="flex h-full min-h-[200px] items-center justify-center px-3 text-center text-sm text-stone-400">추가 가능한 공정이 없다.</div>
                  ) : (
                    <div className="space-y-2">
                      {availableProcessDefinitions.map((definition) => {
                        const selected = selectedAvailableProcess === definition.type;
                        return (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => {
                              onSelectAvailableProcess(definition.type);
                              onSelectAssignedProcess(null);
                            }}
                            className={[
                              "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                              selected ? "border-stone-900 bg-white text-stone-900" : "border-transparent bg-white text-stone-700 hover:border-stone-300",
                            ].join(" ")}
                          >
                            <span className="font-medium">{definition.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row items-center justify-center gap-2 md:flex-col">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedAvailableProcess) return;
                    onToggleOutsourcingProcess(selectedAvailableProcess);
                    onSelectAssignedProcess(selectedAvailableProcess);
                    onSelectAvailableProcess(null);
                  }}
                  disabled={!selectedAvailableProcess}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="선택한 공정을 오른쪽으로 추가"
                >
                  <span className="block -rotate-90">▾</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedAssignedProcess) return;
                    onToggleOutsourcingProcess(selectedAssignedProcess);
                    onSelectAvailableProcess(selectedAssignedProcess);
                    onSelectAssignedProcess(null);
                  }}
                  disabled={!selectedAssignedProcess}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="선택한 공정을 왼쪽으로 제거"
                >
                  <span className="block rotate-90">▾</span>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">선택된 공정</p>
                <div className="min-h-[220px] rounded-2xl border border-stone-200 bg-stone-50 p-2">
                  {assignedProcessDefinitions.length === 0 ? (
                    <div className="flex h-full min-h-[200px] items-center justify-center px-3 text-center text-sm text-stone-400">선택된 공정이 없다.</div>
                  ) : (
                    <div className="space-y-2">
                      {assignedProcessDefinitions.map((definition) => {
                        const selected = selectedAssignedProcess === definition.type;
                        return (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => {
                              onSelectAssignedProcess(definition.type);
                              onSelectAvailableProcess(null);
                            }}
                            className={[
                              "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                              selected ? "border-stone-900 bg-white text-stone-900" : "border-transparent bg-white text-stone-700 hover:border-stone-300",
                            ].join(" ")}
                          >
                            <span className="font-medium">{definition.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="partner-memo" className="text-sm font-medium text-stone-800">메모</label>
        <textarea
          id="partner-memo"
          value={draft.memo}
          onChange={(event) => onDraftChange((current) => ({ ...current, memo: event.target.value }))}
          placeholder="거래처/공장 메모 입력"
          rows={4}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        />
      </div>
    </ModalShell>
  );
}
