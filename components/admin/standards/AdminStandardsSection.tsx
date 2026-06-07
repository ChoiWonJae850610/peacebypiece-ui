"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import AdminFilePolicySettingsModal from "@/components/admin/standards/AdminFilePolicySettingsModal";
import AdminNotificationPolicySettingsModal from "@/components/admin/standards/AdminNotificationPolicySettingsModal";
import { fetchAdminStandardProcessesFromApi, fetchAdminStandardsFromApi, saveAdminItemCategoriesToApi } from "@/lib/admin/settings/standardsApiClient";
import type { AdminItemCategoryDefinition, AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";
import { useAdminWorkspaceTools } from "@/lib/admin/useAdminWorkspaceTools";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type StandardAction = {
  key: "logs" | "filePolicy" | "notifications";
  title: string;
  description: string;
  statusLabel: string;
  onClick?: () => void;
};

type StandardTabKey = "items" | "units" | "processes";

type StandardRequestTarget = "units" | "processes";

type RequestSubmitState = "idle" | "submitting" | "success" | "failed";

type AdminStandardsSectionProps = {
  mode?: "full" | "standards-only";
  capabilities?: {
    canManage?: boolean;
  };
};

function sortProcessesByLabel(items: OutsourcingProcessDefinition[]) {
  return items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
}

function getNextSortOrder(items: AdminItemCategoryDefinition[]) {
  const maxSortOrder = items.reduce((maxValue, item) => Math.max(maxValue, Number.isFinite(item.sort_order) ? item.sort_order : 0), 0);
  return maxSortOrder + 10;
}

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatStandardCount(activeCount: number, totalCount: number, emptyLabel: string, suffix: string) {
  if (totalCount === 0) return emptyLabel;
  return `${activeCount}/${totalCount}${suffix}`;
}

function isRequestTarget(value: StandardTabKey): value is StandardRequestTarget {
  return value === "units" || value === "processes";
}

async function submitStandardAdditionRequest(target: StandardRequestTarget, name: string, reason: string) {
  const targetLabel = target === "units" ? "단위 표준" : "외주공정 유형";
  const normalizedReason = reason.trim();
  const message = normalizedReason
    ? `${targetLabel} 추가 요청\n\n요청 항목: ${name}\n요청 사유: ${normalizedReason}`
    : `${targetLabel} 추가 요청\n\n요청 항목: ${name}\n요청 사유: 기준정보 화면에서 추가 요청했습니다.`;

  const response = await fetch("/api/admin/settings/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feedbackType: "improvement",
      title: `${targetLabel} 추가 요청: ${name}`,
      message,
      source: `admin_settings_standards_${target}`,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "STANDARD_REQUEST_CREATE_FAILED");
}

export default function AdminStandardsSection({ mode = "full", capabilities }: AdminStandardsSectionProps) {
  const notificationTools = useAdminWorkspaceTools();
  const t = useAdminTranslation();
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>([]);
  const [unitDefinitions, setUnitDefinitions] = useState<AdminUnitDefinition[]>([]);
  const [itemCategoryDefinitions, setItemCategoryDefinitions] = useState<AdminItemCategoryDefinition[]>([]);
  const [defaultItemCategoryDefinitions, setDefaultItemCategoryDefinitions] = useState<AdminItemCategoryDefinition[]>([]);
  const [isFilePolicyModalOpen, setIsFilePolicyModalOpen] = useState(false);
  const [isNotificationPolicyModalOpen, setIsNotificationPolicyModalOpen] = useState(false);
  const [activeStandardTab, setActiveStandardTab] = useState<StandardTabKey>("items");
  const [newItemCategoryName, setNewItemCategoryName] = useState("");
  const [itemInlineError, setItemInlineError] = useState("");
  const [itemSavingId, setItemSavingId] = useState<string | null>(null);
  const [requestTarget, setRequestTarget] = useState<StandardRequestTarget | null>(null);
  const [requestName, setRequestName] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const [requestSubmitState, setRequestSubmitState] = useState<RequestSubmitState>("idle");
  const standardsLoadSeqRef = useRef(0);
  const canManageStandards = capabilities?.canManage ?? true;

  useEffect(() => {
    let isMounted = true;
    const requestId = standardsLoadSeqRef.current + 1;
    standardsLoadSeqRef.current = requestId;

    fetchAdminStandardProcessesFromApi()
      .then((payload) => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setProcessDefinitions(payload.processDefinitions ?? []);
      })
      .catch(() => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setProcessDefinitions([]);
      });

    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setUnitDefinitions(Array.isArray(payload.units) ? payload.units : []);
        setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : []);
        setDefaultItemCategoryDefinitions(Array.isArray(payload.defaultItemCategories) ? payload.defaultItemCategories : []);
      })
      .catch(() => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setUnitDefinitions([]);
        setItemCategoryDefinitions([]);
        setDefaultItemCategoryDefinitions([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeProcessDefinitions = useMemo(
    () => sortProcessesByLabel(processDefinitions.filter((definition) => definition.isActive)),
    [processDefinitions],
  );

  const sortedItemCategoryDefinitions = useMemo(
    () => itemCategoryDefinitions.slice().sort((a, b) => a.name.localeCompare(b.name, "ko-KR") || a.level - b.level || a.sort_order - b.sort_order),
    [itemCategoryDefinitions],
  );

  const sortedUnitDefinitions = useMemo(
    () => unitDefinitions.slice().sort((a, b) => a.name.localeCompare(b.name, "ko-KR") || a.sort_order - b.sort_order),
    [unitDefinitions],
  );

  const sortedProcessDefinitions = useMemo(
    () => processDefinitions.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR") || a.sortOrder - b.sortOrder),
    [processDefinitions],
  );

  const saveItemCategories = useCallback(
    (nextCategories: AdminItemCategoryDefinition[], savingId: string) => {
      if (!canManageStandards) return;
      setItemSavingId(savingId);
      setItemInlineError("");
      saveAdminItemCategoriesToApi(nextCategories)
        .then((payload) => {
          setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : nextCategories);
          setNewItemCategoryName("");
        })
        .catch(() => setItemInlineError(t("standards.section.saveItemFailed", "생산품 유형 저장에 실패했습니다. 연결 상태를 확인하세요.")))
        .finally(() => setItemSavingId(null));
    },
    [canManageStandards, t],
  );

  const addItemCategory = useCallback(() => {
    if (!canManageStandards || itemSavingId) return;
    const name = newItemCategoryName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      setItemInlineError(t("standards.items.nameTooShort", "생산품 유형 이름을 2자 이상 입력하세요."));
      return;
    }
    if (itemCategoryDefinitions.some((item) => item.name.trim() === name && item.level === 1 && !item.parent_id)) {
      setItemInlineError(t("standards.items.duplicate", "이미 등록된 생산품 유형입니다."));
      return;
    }

    const nextItem: AdminItemCategoryDefinition = {
      id: createClientId("item_category"),
      parent_id: null,
      level: 1,
      name,
      is_active: true,
      sort_order: getNextSortOrder(itemCategoryDefinitions),
    };

    saveItemCategories([...itemCategoryDefinitions, nextItem], "new");
  }, [canManageStandards, itemCategoryDefinitions, itemSavingId, newItemCategoryName, saveItemCategories, t]);

  const toggleItemCategory = useCallback(
    (itemId: string, nextActive: boolean) => {
      if (!canManageStandards || itemSavingId) return;
      const nextCategories = itemCategoryDefinitions.map((item) => (item.id === itemId ? { ...item, is_active: nextActive } : item));
      saveItemCategories(nextCategories, itemId);
    },
    [canManageStandards, itemCategoryDefinitions, itemSavingId, saveItemCategories],
  );

  const openRequestPanel = useCallback((target: StandardRequestTarget) => {
    setRequestTarget(target);
    setRequestName("");
    setRequestReason("");
    setRequestNotice("");
    setRequestSubmitState("idle");
  }, []);

  const closeRequestPanel = useCallback(() => {
    if (requestSubmitState === "submitting") return;
    setRequestTarget(null);
    setRequestName("");
    setRequestReason("");
    setRequestNotice("");
    setRequestSubmitState("idle");
  }, [requestSubmitState]);

  const submitRequest = useCallback(() => {
    if (!requestTarget || requestSubmitState === "submitting") return;
    const name = requestName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      setRequestNotice(t("standards.request.nameTooShort", "추가 요청할 항목명을 2자 이상 입력하세요."));
      setRequestSubmitState("failed");
      return;
    }

    setRequestSubmitState("submitting");
    setRequestNotice("");
    submitStandardAdditionRequest(requestTarget, name, requestReason)
      .then(() => {
        setRequestSubmitState("success");
        setRequestName("");
        setRequestReason("");
        setRequestNotice(t("standards.request.success", "추가 요청을 접수했습니다. 처리 결과는 문의 이력에서 확인할 수 있습니다."));
      })
      .catch(() => {
        setRequestSubmitState("failed");
        setRequestNotice(t("standards.request.failed", "추가 요청을 접수하지 못했습니다. 잠시 후 다시 시도하세요."));
      });
  }, [requestName, requestReason, requestSubmitState, requestTarget, t]);

  const policyActions: StandardAction[] = [
    { key: "notifications", title: t("standards.actions.notifications.title", "알림 정책"), description: t("standards.actions.notifications.description", "검토·발주·용량·삭제 결과"), statusLabel: t("standards.common.manage", "관리"), onClick: () => setIsNotificationPolicyModalOpen(true) },
    { key: "logs", title: t("standards.actions.logs.title", "로그 이벤트"), description: t("standards.actions.logs.description", "작업지시서 변경 기록 이벤트"), statusLabel: t("standards.common.manage", "관리"), onClick: notificationTools.openNotificationModal },
    { key: "filePolicy", title: t("standards.actions.filePolicy.title", "저장 정책"), description: t("standards.actions.filePolicy.description", "용량·휴지통·실제삭제 기준"), statusLabel: t("standards.common.manage", "관리"), onClick: () => setIsFilePolicyModalOpen(true) },
  ];

  const inUseSuffix = t("standards.common.inUseSuffix", "개 사용중");
  const emptyDbLabel = t("standards.common.emptyDbLabel", "등록된 항목 없음");
  const tabs = [
    {
      key: "items" as const,
      title: t("standards.actions.items.title", "생산품 유형"),
      description: formatStandardCount(itemCategoryDefinitions.filter((item) => item.is_active).length, itemCategoryDefinitions.length, t("standards.actions.items.empty", "고객사 품목 없음"), inUseSuffix),
    },
    {
      key: "units" as const,
      title: t("standards.actions.units.title", "단위 표준"),
      description: formatStandardCount(unitDefinitions.filter((unit) => unit.is_active).length, unitDefinitions.length, emptyDbLabel, inUseSuffix),
    },
    {
      key: "processes" as const,
      title: t("standards.actions.processes.title", "외주공정 유형"),
      description: formatStandardCount(activeProcessDefinitions.length, processDefinitions.length, emptyDbLabel, inUseSuffix),
    },
  ];

  const selectedTab = tabs.find((tab) => tab.key === activeStandardTab) ?? tabs[0];
  const hasMissingDbStandards = unitDefinitions.length === 0 || processDefinitions.length === 0 || defaultItemCategoryDefinitions.length === 0;
  const showPolicySection = mode === "full";

  const renderActionGrid = (actions: StandardAction[]) => (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          disabled={!action.onClick}
          className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition enabled:hover:border-stone-300 enabled:hover:bg-white disabled:cursor-default disabled:opacity-70"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-stone-950">{action.title}</span>
            <span className="mt-0.5 block text-xs font-medium leading-5 text-stone-500">{action.description}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-stone-600 shadow-sm">{action.statusLabel}</span>
        </button>
      ))}
    </div>
  );

  const renderUsageToggle = (isActive: boolean, disabled: boolean, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
        isActive
          ? "border-stone-900 bg-stone-950 text-white shadow-sm"
          : "border-stone-200 bg-stone-100 text-stone-500"
      } ${disabled || !onClick ? "cursor-default opacity-70" : "hover:scale-[1.01]"}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : "bg-stone-300"}`} />
      {isActive ? t("standards.common.active", "사용") : t("standards.common.inactive", "미사용")}
    </button>
  );

  const renderItemManagement = () => (
    <div className="space-y-3">
      {canManageStandards ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              value={newItemCategoryName}
              onChange={(event) => {
                setNewItemCategoryName(event.target.value);
                setItemInlineError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") addItemCategory();
              }}
              placeholder={t("standards.items.addPlaceholder", "추가할 생산품 유형 입력")}
              className="min-h-10 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
            />
            <button
              type="button"
              onClick={addItemCategory}
              disabled={itemSavingId !== null}
              className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-stone-800 disabled:cursor-default disabled:bg-stone-300"
            >
              {itemSavingId === "new" ? t("standards.common.saving", "저장 중") : t("standards.items.add", "생산품 유형 추가")}
            </button>
          </div>
          {itemInlineError ? <p className="mt-2 text-xs font-semibold text-rose-600">{itemInlineError}</p> : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-stone-200">
        <div className="grid grid-cols-[minmax(0,1fr)_112px] bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500">
          <span>{t("standards.table.name", "이름")}</span>
          <span className="text-right">{t("standards.table.status", "사용 여부")}</span>
        </div>
        <div className="max-h-[360px] overflow-auto divide-y divide-stone-100 bg-white">
          {sortedItemCategoryDefinitions.length > 0 ? sortedItemCategoryDefinitions.map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_112px] items-center px-4 py-3 text-sm">
              <span className="truncate font-semibold text-stone-900">{item.name}</span>
              <span className="flex justify-end">
                {renderUsageToggle(item.is_active, itemSavingId !== null || !canManageStandards, () => toggleItemCategory(item.id, !item.is_active))}
              </span>
            </div>
          )) : (
            <div className="px-4 py-8 text-center text-sm font-medium text-stone-500">{t("standards.actions.items.empty", "고객사 품목 없음")}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReadOnlyRows = (target: StandardRequestTarget) => {
    const rows = target === "units"
      ? sortedUnitDefinitions.map((unit) => ({ id: unit.id, name: unit.name, isActive: unit.is_active }))
      : sortedProcessDefinitions.map((process) => ({ id: process.type, name: process.label, isActive: process.isActive }));

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium leading-5 text-stone-500">
            {target === "units"
              ? t("standards.units.requestDescription", "단위 표준은 전체 운영 기준과 연결되므로 필요한 항목을 요청하면 시스템관리자가 검토합니다.")
              : t("standards.processes.requestDescription", "외주공정 유형은 발주/협력업체 기준과 연결되므로 필요한 항목을 요청하면 시스템관리자가 검토합니다.")}
          </p>
          {canManageStandards ? (
            <button
              type="button"
              onClick={() => openRequestPanel(target)}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
            >
              {t("standards.request.open", "유형 추가 요청")}
            </button>
          ) : null}
        </div>

        {requestTarget === target ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <div className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-center">
              <input
                value={requestName}
                onChange={(event) => setRequestName(event.target.value)}
                placeholder={target === "units" ? t("standards.request.unitPlaceholder", "예: 마, SET") : t("standards.request.processPlaceholder", "예: 프린트, 워싱")}
                className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
              />
              <input
                value={requestReason}
                onChange={(event) => setRequestReason(event.target.value)}
                placeholder={t("standards.request.reasonPlaceholder", "요청 사유 또는 사용 예시")}
                className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={requestSubmitState === "submitting"}
                  className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-stone-800 disabled:cursor-default disabled:bg-stone-300"
                >
                  {requestSubmitState === "submitting" ? t("standards.request.submitting", "접수 중") : t("standards.request.submit", "요청하기")}
                </button>
                <button type="button" onClick={closeRequestPanel} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-950">
                  {t("common.cancel", "취소")}
                </button>
              </div>
            </div>
            {requestNotice ? (
              <p className={`mt-2 text-xs font-semibold ${requestSubmitState === "success" ? "text-emerald-700" : "text-rose-600"}`}>{requestNotice}</p>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <div className="grid grid-cols-[minmax(0,1fr)_112px] bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500">
            <span>{t("standards.table.name", "이름")}</span>
            <span className="text-right">{t("standards.table.status", "사용 여부")}</span>
          </div>
          <div className="max-h-[360px] overflow-auto divide-y divide-stone-100 bg-white">
            {rows.length > 0 ? rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_112px] items-center px-4 py-3 text-sm">
                <span className="truncate font-semibold text-stone-900">{row.name}</span>
                <span className="flex justify-end">{renderUsageToggle(row.isActive, true)}</span>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm font-medium text-stone-500">{emptyDbLabel}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSelectedStandardPanel = () => {
    if (activeStandardTab === "items") return renderItemManagement();
    if (isRequestTarget(activeStandardTab)) return renderReadOnlyRows(activeStandardTab);
    return null;
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {showPolicySection ? (
        <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="shrink-0 text-lg font-semibold text-stone-950">{t("standards.section.policyTitle", "정책 관리")}</h2>
          <div className="mt-3">{renderActionGrid(policyActions)}</div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-stone-200 bg-white p-3.5 shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-950">{t("standards.section.standardTitle", "기준정보 설정")}</h2>
            <p className="mt-1 text-xs font-medium text-stone-500">
              {t("standards.section.standardDescription", "생산품 유형은 직접 관리하고, 단위·외주공정 유형은 요청으로 운영합니다.")}
            </p>
          </div>
          <p className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">{selectedTab.title}</p>
        </div>

        <div className="mt-3 grid gap-2 rounded-2xl bg-stone-100 p-1 sm:grid-cols-3">
          {tabs.map((tab) => {
            const selected = tab.key === activeStandardTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveStandardTab(tab.key);
                  setRequestTarget(null);
                  setRequestNotice("");
                }}
                className={`rounded-xl px-3 py-2 text-left transition ${selected ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
              >
                <span className={`block text-sm font-semibold ${selected ? "text-stone-950" : "text-stone-600"}`}>{tab.title}</span>
                <span className="mt-0.5 block text-xs font-medium text-stone-500">{tab.description}</span>
              </button>
            );
          })}
        </div>

        {hasMissingDbStandards ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            {t("standards.section.missingSeedNotice", "일부 기준정보가 비어 있습니다. 필요한 항목은 탭 안에서 직접 관리하거나 요청하세요.")}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">{selectedTab.title}</p>
          <p className="text-xs font-medium text-stone-500">{selectedTab.description}</p>
        </div>

        <div className="mt-2.5">{renderSelectedStandardPanel()}</div>
      </div>

      <AdminFilePolicySettingsModal open={isFilePolicyModalOpen} onClose={() => setIsFilePolicyModalOpen(false)} />

      <AdminNotificationPolicySettingsModal open={isNotificationPolicyModalOpen} onClose={() => setIsNotificationPolicyModalOpen(false)} />

      <AdminNotificationSettingsModal
        open={notificationTools.activeModal === "notification"}
        onClose={notificationTools.closeModal}
        notificationSettings={notificationTools.notificationSettings}
        onToggleNotificationSetting={notificationTools.handleToggleNotificationSetting}
        title={t("standards.section.logEventsTitle", "로그 이벤트")}
        description=""
        onResetNotificationSettings={notificationTools.resetNotificationSettings}
      />
    </section>
  );
}
