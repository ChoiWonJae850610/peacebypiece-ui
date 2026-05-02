"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import { APP_VERSION } from "@/lib/constants/app";
import {
  buildPartnerListViewModel,
  createDefaultOutsourcingProcessDefinitions,
  DEFAULT_PARTNER_FILTER_STATE,
  togglePartnerFilterSelection,
  type OutsourcingProcessDefinition,
  type PartnerFilterChip,
  type PartnerListItemViewModel,
  type PartnerStatusFilter,
} from "@/lib/admin/partner";
import { fetchPartnerMasterItemsFromApi } from "@/lib/admin/partner/apiClient";
import { useI18n } from "@/lib/i18n";
import type { Partner } from "@/types/partner";

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
      {label}
    </div>
  );
}

function PartnerTypeBadges({ item }: { item: PartnerListItemViewModel }) {
  return (
    <div className="space-y-1.5">
      <div className="flex min-h-7 flex-wrap items-center gap-1.5">
        {item.hasBaseTypes ? (
          item.baseTypeBadges.map((badge) => (
            <span
              key={badge.key}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.tone}`}
            >
              {badge.label}
            </span>
          ))
        ) : (
          <span className="text-xs text-stone-400">유형 없음</span>
        )}
      </div>
      {item.hasOutsourcingProcesses ? (
        <div className="max-w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium leading-5 text-slate-600">
          <span
            className="block max-w-[220px] truncate"
            title={item.outsourcingProcessLabel}
          >
            {item.outsourcingProcessLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function PartnerReadOnlyTable({ items }: { items: PartnerListItemViewModel[] }) {
  if (items.length === 0) {
    return <EmptyState label="표시할 거래처/공장 데이터가 없습니다." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="hidden grid-cols-[1.2fr_0.72fr_0.82fr_1fr_1.1fr_0.72fr_0.78fr] gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500 xl:grid">
        <span>업체명</span>
        <span>담당자</span>
        <span>연락처</span>
        <span>이메일</span>
        <span>유형/외주공정</span>
        <span>상태</span>
        <span>수정일</span>
      </div>
      <div className="divide-y divide-stone-100">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1.2fr_0.72fr_0.82fr_1fr_1.1fr_0.72fr_0.78fr] xl:items-center"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400 xl:hidden">
                업체명
              </p>
              <p className="truncate font-semibold text-stone-950" title={item.name}>
                {item.name}
              </p>
              {item.memo ? (
                <p className="mt-1 truncate text-xs text-stone-500">
                  {item.memo}
                </p>
              ) : null}
            </div>
            <p className="truncate text-stone-600" title={item.contactName}>
              {item.contactName}
            </p>
            <p className="truncate text-stone-600" title={item.phone}>
              {item.phone}
            </p>
            <p className="truncate text-stone-600" title={item.email}>
              {item.email}
            </p>
            <PartnerTypeBadges item={item} />
            <span
              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.isActive
                  ? "bg-teal-100 text-teal-700"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {item.isActive ? "사용중" : "미사용"}
            </span>
            <p className="text-stone-600">{item.updatedAtLabel || "-"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function AdminPartnersReadOnlyPage() {
  const { i18n } = useI18n();
  const partnerText = i18n.admin.partnerMaster;

  const [partners, setPartners] = useState<Partner[]>([]);
  const [processDefinitions, setProcessDefinitions] = useState<
    OutsourcingProcessDefinition[]
  >(createDefaultOutsourcingProcessDefinitions());
  const [selectedTypes, setSelectedTypes] = useState<PartnerFilterChip[]>(
    DEFAULT_PARTNER_FILTER_STATE.selectedTypes,
  );
  const [selectedStatus, setSelectedStatus] = useState<PartnerStatusFilter>(
    DEFAULT_PARTNER_FILTER_STATE.status,
  );
  const [searchTerm, setSearchTerm] = useState(
    DEFAULT_PARTNER_FILTER_STATE.searchTerm,
  );
  const [message, setMessage] = useState("거래처/공장 데이터를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);

    fetchPartnerMasterItemsFromApi()
      .then((payload) => {
        if (!mounted) {
          return;
        }

        setPartners(payload.partners);
        if (payload.processDefinitions) {
          setProcessDefinitions(payload.processDefinitions);
        }
        setMessage("DB 기준 거래처/공장 데이터를 불러왔습니다.");
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        setPartners([]);
        setMessage(
          error instanceof Error
            ? error.message
            : "거래처/공장 데이터를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const listViewModel = useMemo(
    () =>
      buildPartnerListViewModel(
        partners,
        { selectedTypes, status: selectedStatus, searchTerm },
        processDefinitions,
        partnerText.typeLabels,
      ),
    [
      partnerText.typeLabels,
      partners,
      processDefinitions,
      searchTerm,
      selectedStatus,
      selectedTypes,
    ],
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                ADMIN PARTNERS
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                거래처/공장관리
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                공장, 원단, 부자재, 외주처 기준정보를 read-only로 확인하는 관리자 화면입니다.
                거래처 생성, 수정, 외주공정 저장 action은 이번 버전에서 연결하지 않습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/admin"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                관리자 홈
              </Link>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">전체</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">
              {listViewModel.summary.total}
            </p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">사용중</p>
            <p className="mt-3 text-2xl font-semibold text-teal-700">
              {listViewModel.summary.active}
            </p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">미사용</p>
            <p className="mt-3 text-2xl font-semibold text-stone-600">
              {listViewModel.summary.inactive}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                연결 상태
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {message}
              </p>
            </div>
            <code className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
              GET /api/admin/partners
            </code>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <PartnerMasterFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filterOptions={listViewModel.filterOptions}
            selectedTypes={selectedTypes}
            onToggleType={(value) =>
              setSelectedTypes((current) =>
                togglePartnerFilterSelection(current, value),
              )
            }
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            filteredCount={listViewModel.filteredCount}
            hasSearch={listViewModel.hasSearch}
          />

          <div className="mt-5">
            {isLoading ? (
              <EmptyState label="거래처/공장 데이터를 불러오는 중입니다." />
            ) : (
              <PartnerReadOnlyTable items={listViewModel.items} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
