"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { mockPartnerRepository } from "@/lib/repositories/mockPartnerRepository";
import {
  OUTSOURCING_PROCESS_TYPE_VALUES,
  PARTNER_TYPE_VALUES,
  type OutsourcingProcessType,
  type Partner,
  type PartnerDraft,
  type PartnerType,
} from "@/types/partner";

const PARTNER_TYPE_META: Record<PartnerType, { label: string; tone: string }> = {
  factory: { label: "공장", tone: "bg-sky-100 text-sky-700" },
  material_vendor: { label: "원단 거래처", tone: "bg-emerald-100 text-emerald-700" },
  subsidiary_vendor: { label: "부자재 거래처", tone: "bg-amber-100 text-amber-700" },
  outsourcing_vendor: { label: "외주처", tone: "bg-violet-100 text-violet-700" },
};

const OUTSOURCING_PROCESS_META: Record<OutsourcingProcessType, { label: string }> = {
  cutting: { label: "재단" },
  printing: { label: "나염/프린트" },
  embroidery: { label: "자수" },
  washing: { label: "워싱" },
  finishing: { label: "후가공" },
};

const EMPTY_DRAFT: PartnerDraft = {
  name: "",
  partnerTypes: [],
  isActive: true,
  contactName: "",
  phone: "",
  outsourcingProcessTypes: [],
  memo: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function buildDraftFromPartner(partner: Partner): PartnerDraft {
  return {
    name: partner.name,
    partnerTypes: [...partner.partnerTypes],
    isActive: partner.isActive,
    contactName: partner.contactName ?? "",
    phone: partner.phone ?? "",
    outsourcingProcessTypes: [...(partner.outsourcingProcessTypes ?? [])],
    memo: partner.memo,
  };
}

export default function PartnerMasterSection() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedType, setSelectedType] = useState<PartnerType | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PartnerDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    setPartners(mockPartnerRepository.listPartners());
  }, []);

  const filteredPartners = useMemo(() => {
    if (selectedType === "all") return partners;
    return partners.filter((partner) => partner.partnerTypes.includes(selectedType));
  }, [partners, selectedType]);

  const summary = useMemo(() => {
    const activeCount = partners.filter((partner) => partner.isActive).length;
    return {
      total: partners.length,
      active: activeCount,
      inactive: partners.length - activeCount,
    };
  }, [partners]);

  const openCreateModal = useCallback(() => {
    setEditingPartnerId(null);
    setDraft({ ...EMPTY_DRAFT, partnerTypes: [], outsourcingProcessTypes: [] });
    setFormError("");
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((partner: Partner) => {
    setEditingPartnerId(partner.id);
    setDraft(buildDraftFromPartner(partner));
    setFormError("");
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPartnerId(null);
    setDraft({ ...EMPTY_DRAFT, partnerTypes: [], outsourcingProcessTypes: [] });
    setFormError("");
  }, []);

  const toggleType = (type: PartnerType) => {
    setDraft((current) => {
      const nextTypes = current.partnerTypes.includes(type)
        ? current.partnerTypes.filter((item) => item !== type)
        : [...current.partnerTypes, type];

      return {
        ...current,
        partnerTypes: nextTypes,
        outsourcingProcessTypes: nextTypes.includes("outsourcing_vendor") ? current.outsourcingProcessTypes : [],
      };
    });
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
    const normalizedName = draft.name.trim();
    if (!normalizedName) {
      setFormError("업체명을 입력하세요.");
      return;
    }
    if (draft.partnerTypes.length === 0) {
      setFormError("유형을 하나 이상 선택하세요.");
      return;
    }

    const normalizedDraft: PartnerDraft = {
      ...draft,
      name: normalizedName,
      contactName: draft.contactName.trim(),
      phone: draft.phone.trim(),
      outsourcingProcessTypes: draft.partnerTypes.includes("outsourcing_vendor") ? [...draft.outsourcingProcessTypes] : [],
      memo: draft.memo.trim(),
    };

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

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Master Data</p>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-stone-900">기준정보 관리 · 거래처/공장 관리</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              공장, 원단 거래처, 부자재 거래처, 외주처를 하나의 Partner master로 관리한다. 이번 단계에서는
              담당자, 연락처, 외주 가능 공정(복수 선택)까지 확장하고 mock repository에 저장한다.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          거래처/공장 등록
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">전체 업체</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{summary.total}</p>
        </article>
        <article className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">사용중</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{summary.active}</p>
        </article>
        <article className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">미사용</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{summary.inactive}</p>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedType("all")}
          className={[
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            selectedType === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200",
          ].join(" ")}
        >
          전체
        </button>
        {PARTNER_TYPE_VALUES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              selectedType === type ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200",
            ].join(" ")}
          >
            {PARTNER_TYPE_META[type].label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.5fr)_120px_120px_140px] gap-4 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 md:grid">
          <span>업체명</span>
          <span>유형</span>
          <span>상태</span>
          <span>수정일</span>
          <span>관리</span>
        </div>
        <div className="divide-y divide-stone-200">
          {filteredPartners.length === 0 ? (
            <div className="px-4 py-10 text-sm text-stone-500">선택한 조건에 맞는 거래처/공장이 없다.</div>
          ) : (
            filteredPartners.map((partner) => (
              <article key={partner.id} className="px-4 py-4">
                <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.5fr)_120px_120px_140px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900 md:text-base">{partner.name}</p>
                    <div className="mt-1 space-y-1 text-xs leading-5 text-stone-500">
                      <p>{partner.contactName || partner.phone ? `${partner.contactName || "대표자 미등록"} · ${partner.phone || "연락처 미등록"}` : "대표자/연락처 미등록"}</p>
                      {partner.outsourcingProcessTypes?.length ? (
                        <p>가능 공정 · {partner.outsourcingProcessTypes.map((type) => OUTSOURCING_PROCESS_META[type].label).join(", ")}</p>
                      ) : null}
                      <p>{partner.memo || "메모 없음"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {partner.partnerTypes.map((type) => (
                      <span key={`${partner.id}-${type}`} className={`rounded-full px-2.5 py-1 text-xs font-medium ${PARTNER_TYPE_META[type].tone}`}>
                        {PARTNER_TYPE_META[type].label}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                      partner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600",
                    ].join(" ")}>{partner.isActive ? "사용중" : "미사용"}</span>
                  </div>
                  <p className="text-sm text-stone-600">{formatDate(partner.updatedAt)}</p>
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
        description="Partner master 기준으로 업체명, 대표자, 연락처, 유형, 사용 여부를 관리한다."
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
        <div className="grid gap-4 md:grid-cols-2">
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
            <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-300 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, isActive: true }))}
                className={[
                  "rounded-full px-3 py-2 text-sm font-medium transition",
                  draft.isActive ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                ].join(" ")}
              >
                사용중
              </button>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, isActive: false }))}
                className={[
                  "rounded-full px-3 py-2 text-sm font-medium transition",
                  !draft.isActive ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                ].join(" ")}
              >
                미사용
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="연락처 입력"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-800">유형</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PARTNER_TYPE_VALUES.map((type) => {
              const checked = draft.partnerTypes.includes(type);
              return (
                <label
                  key={type}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                    checked ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-white hover:border-stone-400",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleType(type)}
                    className="mt-1 h-4 w-4 rounded border-stone-300"
                  />
                  <span className="font-medium text-stone-800">{PARTNER_TYPE_META[type].label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {draft.partnerTypes.includes("outsourcing_vendor") ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-stone-800">수행 가능 외주 공정</p>
              <p className="text-xs leading-5 text-stone-500">
                다음 단계에서 공정을 선택하면 이 목록에 포함된 외주처만 노출되도록 연결할 준비 필드다.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {OUTSOURCING_PROCESS_TYPE_VALUES.map((type) => {
                const checked = draft.outsourcingProcessTypes.includes(type);
                return (
                  <label
                    key={type}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                      checked ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-white hover:border-stone-400",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOutsourcingProcess(type)}
                      className="mt-1 h-4 w-4 rounded border-stone-300"
                    />
                    <span className="font-medium text-stone-800">{OUTSOURCING_PROCESS_META[type].label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

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
    </section>
  );
}
