"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusToggle from "@/components/common/StatusToggle";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  BASE_PARTNER_TYPE_VALUES,
  buildPartnerDraftFromEntity,
  buildPartnerListViewModel,
  createDefaultOutsourcingProcessDefinitions,
  createEmptyPartnerDraft,
  createOutsourcingProcessDefinition,
  moveOutsourcingProcessDefinition,
  normalizeOutsourcingProcessDefinitions,
  removeOutsourcingProcessDefinition,
  DEFAULT_PARTNER_FILTER_STATE,
  formatPartnerDate,
  formatPartnerPhone,
  normalizePartnerDraft,
  PARTNER_STATUS_FILTER_OPTIONS,
  PARTNER_TYPE_META,
  togglePartnerFilterSelection,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { mockPartnerRepository } from "@/lib/repositories/mockPartnerRepository";
import {
  type OutsourcingProcessType,
  type Partner,
  type PartnerDraft,
  type PartnerType,
} from "@/types/partner";
import { formatPhoneNumber } from "@/lib/utils/phoneFormat";

export default function PartnerMasterSection() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_PARTNER_FILTER_STATE.selectedTypes);
  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_PARTNER_FILTER_STATE.status);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_PARTNER_FILTER_STATE.searchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PartnerDraft>(createEmptyPartnerDraft());
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>(
    createDefaultOutsourcingProcessDefinitions(),
  );
  const [selectedAvailableProcess, setSelectedAvailableProcess] = useState<OutsourcingProcessType | null>(null);
  const [selectedAssignedProcess, setSelectedAssignedProcess] = useState<OutsourcingProcessType | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [newProcessLabel, setNewProcessLabel] = useState("");
  const [processFormError, setProcessFormError] = useState("");

  useEffect(() => {
    setPartners(mockPartnerRepository.listPartners());
  }, []);

  const listViewModel = useMemo(
    () => buildPartnerListViewModel(partners, { selectedTypes, status: selectedStatus, searchTerm }, processDefinitions),
    [partners, processDefinitions, searchTerm, selectedStatus, selectedTypes],
  );

  const isOutsourcingEnabled = draft.partnerTypes.includes("outsourcing_vendor");
  const selectedPrimaryType = draft.partnerTypes.find((type) => type !== "outsourcing_vendor") ?? null;
  const availableProcessDefinitions = processDefinitions
    .filter((definition) => definition.isActive && !draft.outsourcingProcessTypes.includes(definition.type))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const assignedProcessDefinitions = processDefinitions
    .filter((definition) => draft.outsourcingProcessTypes.includes(definition.type))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedProcessDefinitions = processDefinitions
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const openCreateModal = useCallback(() => {
    setEditingPartnerId(null);
    setDraft(createEmptyPartnerDraft());
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
    setFormError("");
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((partner: Partner) => {
    setEditingPartnerId(partner.id);
    setDraft(buildPartnerDraftFromEntity(partner));
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
    setFormError("");
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPartnerId(null);
    setDraft(createEmptyPartnerDraft());
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
    setFormError("");
  }, []);

  const closeProcessModal = useCallback(() => {
    setIsProcessModalOpen(false);
    setNewProcessLabel("");
    setProcessFormError("");
  }, []);

  const openProcessModal = useCallback(() => {
    setNewProcessLabel("");
    setProcessFormError("");
    setIsProcessModalOpen(true);
  }, []);

  const setPrimaryType = (type: PartnerType) => {
    setDraft((current) => {
      const nextTypes = current.partnerTypes.filter((item) => item === "outsourcing_vendor");
      if (type !== "outsourcing_vendor") {
        nextTypes.unshift(type);
      }
      return {
        ...current,
        partnerTypes: Array.from(new Set(nextTypes)),
      };
    });
  };

  const setOutsourcingEnabled = (enabled: boolean) => {
    setDraft((current) => ({
      ...current,
      partnerTypes: enabled
        ? Array.from(new Set([...current.partnerTypes.filter((item) => item !== "outsourcing_vendor"), "outsourcing_vendor"]))
        : current.partnerTypes.filter((item) => item !== "outsourcing_vendor"),
      outsourcingProcessTypes: enabled ? current.outsourcingProcessTypes : [],
    }));
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
  };

  const toggleOutsourcingProcess = (type: OutsourcingProcessType) => {
    setDraft((current) => ({
      ...current,
      outsourcingProcessTypes: current.outsourcingProcessTypes.includes(type)
        ? current.outsourcingProcessTypes.filter((item) => item !== type)
        : [...current.outsourcingProcessTypes, type],
    }));
  };

  const handleSubmit = () => {
    const normalizedDraft = normalizePartnerDraft(draft);

    if (!normalizedDraft.name) {
      setFormError("업체명을 입력하세요.");
      return;
    }
    if (normalizedDraft.partnerTypes.length === 0) {
      setFormError("유형을 하나 이상 선택하세요.");
      return;
    }

    const nextPartners = editingPartnerId
      ? (() => {
          mockPartnerRepository.updatePartner(editingPartnerId, normalizedDraft);
          return mockPartnerRepository.listPartners();
        })()
      : (() => {
          mockPartnerRepository.createPartner(normalizedDraft);
          return mockPartnerRepository.listPartners();
        })();

    setPartners(nextPartners);
    closeModal();
  };

  const updateProcessDefinition = (type: OutsourcingProcessType, updater: (current: OutsourcingProcessDefinition) => OutsourcingProcessDefinition) => {
    setProcessDefinitions((current) =>
      normalizeOutsourcingProcessDefinitions(
        current.map((definition) => (definition.type === type ? updater(definition) : definition)),
      ),
    );
  };

  const addProcessDefinition = () => {
    const normalizedLabel = newProcessLabel.trim();

    if (!normalizedLabel) {
      setProcessFormError("공정명을 입력하세요.");
      return;
    }

    if (processDefinitions.some((definition) => definition.label.trim() === normalizedLabel)) {
      setProcessFormError("같은 표시명의 외주공정이 이미 있다.");
      return;
    }

    setProcessDefinitions((current) => [
      ...normalizeOutsourcingProcessDefinitions(current),
      createOutsourcingProcessDefinition(normalizedLabel, current),
    ]);
    setNewProcessLabel("");
    setProcessFormError("");
  };

  const moveProcessDefinition = (type: OutsourcingProcessType, direction: "up" | "down") => {
    setProcessDefinitions((current) => moveOutsourcingProcessDefinition(current, type, direction));
  };

  const deleteProcessDefinition = (type: OutsourcingProcessType) => {
    const targetDefinition = processDefinitions.find((definition) => definition.type === type);
    if (!targetDefinition) return;

    const confirmed = window.confirm(`외주공정 "${targetDefinition.label}"을(를) 삭제할까요?`);
    if (!confirmed) return;

    setProcessDefinitions((current) => removeOutsourcingProcessDefinition(current, type));
    setDraft((current) => ({
      ...current,
      outsourcingProcessTypes: current.outsourcingProcessTypes.filter((item) => item !== type),
    }));
    setSelectedAvailableProcess((current) => (current === type ? null : current));
    setSelectedAssignedProcess((current) => (current === type ? null : current));
  };

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
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
            onClick={openProcessModal}
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            외주공정 관리
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            거래처/공장 등록
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">전체 업체</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{listViewModel.summary.total}</p>
        </article>
        <article className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">사용중</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{listViewModel.summary.active}</p>
        </article>
        <article className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">미사용</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{listViewModel.summary.inactive}</p>
        </article>
      </div>

      <div className="mt-5 space-y-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:items-start">
          <div className="min-w-0 space-y-2">
            <label htmlFor="partner-search" className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              검색
            </label>
            <input
              id="partner-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="업체명, 대표자, 연락처, 이메일, 메모, 공정 검색"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">유형</p>
            <div className="flex flex-wrap gap-2">
              {listViewModel.filterOptions.map((item) => {
                const isSelected = selectedTypes.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedTypes((current) => togglePartnerFilterSelection(current, item.value))}
                    className={[
                      "rounded-full px-3 py-1.5 text-sm font-medium transition",
                      isSelected ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-200",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">상태</p>
            <div className="flex flex-wrap gap-2">
              {PARTNER_STATUS_FILTER_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedStatus(item.value)}
                  className={[
                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                    selectedStatus === item.value ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-200",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-stone-600 md:flex-row md:items-center md:justify-between">
          <p>
            현재 목록 <span className="font-semibold text-stone-900">{listViewModel.filteredCount}</span>개
            {listViewModel.hasSearch ? " · 검색 결과 기준" : ""}
          </p>
          <p>
            사용중 {listViewModel.filteredSummary.active} · 미사용 {listViewModel.filteredSummary.inactive}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
        <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)_120px_120px_140px] gap-4 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 md:grid">
          <span>업체명</span>
          <span>유형</span>
          <span>상태</span>
          <span>수정일</span>
          <span>관리</span>
        </div>
        <div className="divide-y divide-stone-200">
          {listViewModel.filteredPartners.length === 0 ? (
            <div className="px-4 py-10 text-sm text-stone-500">선택한 조건에 맞는 거래처/공장이 없다.</div>
          ) : (
            listViewModel.filteredPartners.map((partner) => (
              <article key={partner.id} className={["px-4 py-4", partner.isActive ? "bg-white" : "bg-stone-50/80"].join(" ")}>
                <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)_120px_120px_140px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-stone-900 md:text-base">{partner.name}</p>
                      {!partner.isActive ? (
                        <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">미사용</span>
                      ) : null}
                    </div>
                    <div className="mt-1 space-y-1 text-xs leading-5 text-stone-500">
                      <p>
                        {partner.contactName || partner.phone
                          ? `${partner.contactName || "대표자 미등록"} · ${formatPartnerPhone(partner.phone) || "연락처 미등록"}`
                          : "대표자 미등록 · 연락처 미등록"}
                      </p>
                      {partner.email ? <p>{partner.email}</p> : null}
                      <p>{partner.memo || "메모 없음"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {partner.partnerTypes
                      .filter((type) => type !== "outsourcing_vendor")
                      .map((type) => (
                        <span key={`${partner.id}-${type}`} className={`rounded-full px-2.5 py-1 text-xs font-medium ${PARTNER_TYPE_META[type].tone}`}>
                          {PARTNER_TYPE_META[type].shortLabel}
                        </span>
                      ))}
                    {(partner.outsourcingProcessTypes ?? []).map((type) => (
                      <span
                        key={`${partner.id}-${type}`}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${listViewModel.processMeta[type].tone}`}
                      >
                        {listViewModel.processMeta[type].label}
                      </span>
                    ))}
                  </div>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        partner.isActive ? "bg-teal-100 text-teal-700" : "bg-stone-200 text-stone-600",
                      ].join(" ")}
                    >
                      {partner.isActive ? "사용중" : "미사용"}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">{formatPartnerDate(partner.updatedAt)}</p>
                  <div>
                    <button
                      type="button"
                      onClick={() => openEditModal(partner)}
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                    >
                      수정
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <ModalShell
        open={isModalOpen}
        onClose={closeModal}
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
                onClick={closeModal}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
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
            <label htmlFor="partner-name" className="text-sm font-medium text-stone-800">
              업체명
            </label>
            <input
              id="partner-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="업체명 입력"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-800">사용 여부</p>
            <div className="flex min-h-[48px] items-center gap-3">
              <StatusToggle
                checked={draft.isActive}
                onChange={(nextValue) => setDraft((current) => ({ ...current, isActive: nextValue }))}
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
            <label htmlFor="partner-contact-name" className="text-sm font-medium text-stone-800">
              대표자
            </label>
            <input
              id="partner-contact-name"
              value={draft.contactName}
              onChange={(event) => setDraft((current) => ({ ...current, contactName: event.target.value }))}
              placeholder="대표자 이름 입력"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="partner-phone" className="text-sm font-medium text-stone-800">
              연락처
            </label>
            <input
              id="partner-phone"
              type="tel"
              value={draft.phone}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => setDraft((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }))}
              placeholder="000-0000-0000"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="partner-email" className="text-sm font-medium text-stone-800">
              이메일
            </label>
            <input
              id="partner-email"
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
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
                const checked = selectedPrimaryType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPrimaryType(type)}
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
                <StatusToggle
                  checked={isOutsourcingEnabled}
                  onChange={setOutsourcingEnabled}
                  srLabel="외주 여부"
                  size="sm"
                />
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
                  onClick={openProcessModal}
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
                                setSelectedAvailableProcess(definition.type);
                                setSelectedAssignedProcess(null);
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
                      toggleOutsourcingProcess(selectedAvailableProcess);
                      setSelectedAssignedProcess(selectedAvailableProcess);
                      setSelectedAvailableProcess(null);
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
                      toggleOutsourcingProcess(selectedAssignedProcess);
                      setSelectedAvailableProcess(selectedAssignedProcess);
                      setSelectedAssignedProcess(null);
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
                                setSelectedAssignedProcess(definition.type);
                                setSelectedAvailableProcess(null);
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
          <label htmlFor="partner-memo" className="text-sm font-medium text-stone-800">
            메모
          </label>
          <textarea
            id="partner-memo"
            value={draft.memo}
            onChange={(event) => setDraft((current) => ({ ...current, memo: event.target.value }))}
            placeholder="거래처/공장 메모 입력"
            rows={4}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </div>
      </ModalShell>

      <ModalShell
        open={isProcessModalOpen}
        onClose={closeProcessModal}
        title="외주공정 관리"
        description="표시명, 사용 여부, 추가/삭제, 위아래 이동만으로 외주공정 목록을 간단하게 관리한다."
        maxWidthClass="md:max-w-3xl"
        bodyClassName="space-y-4"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setProcessDefinitions(createDefaultOutsourcingProcessDefinitions());
                setNewProcessLabel("");
                setProcessFormError("");
              }}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              기본값 복원
            </button>
            <button
              type="button"
              onClick={closeProcessModal}
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
                  setNewProcessLabel(event.target.value);
                  if (processFormError) setProcessFormError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addProcessDefinition();
                  }
                }}
                placeholder="공정명 입력"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </label>
            <button
              type="button"
              onClick={addProcessDefinition}
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
                        updateProcessDefinition(definition.type, (current) => ({ ...current, label: event.target.value }));
                        if (processFormError) setProcessFormError("");
                      }}
                      placeholder="공정명 입력"
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <div className="flex items-center gap-2">
                      <StatusToggle
                        checked={definition.isActive}
                        onChange={(nextValue) =>
                          updateProcessDefinition(definition.type, (current) => ({ ...current, isActive: nextValue }))
                        }
                        srLabel={`${definition.label} 사용 여부`}
                        size="sm"
                      />
                      <span className={`text-sm font-medium ${definition.isActive ? "text-stone-900" : "text-stone-500"}`}>
                        {definition.isActive ? "사용중" : "미사용"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteProcessDefinition(definition.type)}
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                    >
                      삭제
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveProcessDefinition(definition.type, "up")}
                        disabled={isFirst}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`${definition.label} 위로 이동`}
                      >
                        <span className="block rotate-180">▾</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveProcessDefinition(definition.type, "down")}
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
    </section>
  );
}
