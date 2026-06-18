"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import AdminFilePolicySettingsModal from "@/components/admin/standards/AdminFilePolicySettingsModal";
import AdminNotificationPolicySettingsModal from "@/components/admin/standards/AdminNotificationPolicySettingsModal";
import AdminUsageToggle from "@/components/admin/common/AdminUsageToggle";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import WaflSettingsTabs from "@/components/admin/common/WaflSettingsTabs";
import { fetchAdminStandardProcessesFromApi, fetchAdminStandardsFromApi, saveAdminItemCategoriesToApi } from "@/lib/admin/settings/standardsApiClient";
import type { AdminItemCategoryDefinition, AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";
import { useAdminWorkspaceTools } from "@/lib/admin/useAdminWorkspaceTools";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { waflLegacyApiRequest } from "@/lib/api/waflApiClient";

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

function normalizeParentId(value?: string | null) {
  return value && value.trim() ? value : null;
}

function sortItemCategories(items: AdminItemCategoryDefinition[]) {
  return items.slice().sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));
}

function getChildren(items: AdminItemCategoryDefinition[], parentId: string | null, level: AdminItemCategoryDefinition["level"]) {
  return sortItemCategories(items.filter((item) => item.level === level && normalizeParentId(item.parent_id) === parentId));
}

function getDescendantIds(items: AdminItemCategoryDefinition[], itemId: string) {
  const descendants = new Set<string>();
  const visit = (parentId: string) => {
    items.filter((item) => normalizeParentId(item.parent_id) === parentId).forEach((child) => {
      descendants.add(child.id);
      visit(child.id);
    });
  };
  visit(itemId);
  return descendants;
}

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatStandardCount(activeCount: number, totalCount: number, emptyLabel: string, suffix: string) {
  if (totalCount === 0) return emptyLabel;
  return `${activeCount}/${totalCount}${suffix}`;
}

function getUnitUsageDescription(name: string) {
  const normalizedName = name.trim();
  const descriptions: Record<string, string> = {
    개: "일반 수량 단위",
    공정: "작업 공정 또는 단계 수량",
    롤: "원단·부자재 롤 단위",
    미터: "원단 길이 단위",
    박스: "포장·입고 박스 단위",
    벌: "세트 또는 완제품 수량 단위",
  };
  return descriptions[normalizedName] ?? "작업지시서 수량 입력에 사용하는 단위";
}

function getUnitDisplayCode(name: string, code?: string | null) {
  const normalizedName = name.trim();
  const displayCodes: Record<string, string> = {
    개: "pcs",
    공정: "process",
    롤: "roll",
    미터: "m",
    박스: "box",
    벌: "set",
    야드: "yd",
    장: "sheet",
  };
  return displayCodes[normalizedName] ?? code ?? "-";
}

function getProcessDisplayCode(name: string, code?: string | null) {
  const normalizedName = name.trim();
  const displayCodes: Record<string, string> = {
    나염: "print",
    단딩: "binding",
    워싱: "washing",
    자수: "embroidery",
    플리스: "fleece",
  };
  return displayCodes[normalizedName] ?? code ?? "-";
}

function getProcessUsageDescription(name: string) {
  const normalizedName = name.trim();
  const descriptions: Record<string, string> = {
    나염: "프린트·인쇄 외주 공정",
    단딩: "마감·바인딩 외주 공정",
    워싱: "세탁·후가공 외주 공정",
    자수: "자수 장식 외주 공정",
    플리스: "기모·보온 후가공 공정",
  };
  return descriptions[normalizedName] ?? "발주·협력업체 배분에 사용하는 외주 공정";
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

  const payload = await waflLegacyApiRequest<{ ok?: boolean; error?: string }>(
    "/api/admin/settings/feedback",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedbackType: "improvement",
        title: `${targetLabel} 추가 요청: ${name}`,
        message,
        source: `admin_settings_standards_${target}`,
      }),
    },
    "기준정보 추가 요청을 접수하지 못했습니다.",
  );
  if (!payload.ok) throw new Error(payload.error ?? "STANDARD_REQUEST_CREATE_FAILED");
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
  const [selectedItemLevelOneId, setSelectedItemLevelOneId] = useState<string | null>(null);
  const [selectedItemLevelTwoId, setSelectedItemLevelTwoId] = useState<string | null>(null);
  const [newItemLevelOneName, setNewItemLevelOneName] = useState("");
  const [newItemLevelTwoName, setNewItemLevelTwoName] = useState("");
  const [newItemLevelThreeName, setNewItemLevelThreeName] = useState("");
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

    const loadStandards = async () => {
      try {
        const processPayload = await fetchAdminStandardProcessesFromApi();
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setProcessDefinitions(processPayload.processDefinitions ?? []);
      } catch {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setProcessDefinitions([]);
      }

      try {
        const payload = await fetchAdminStandardsFromApi();
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setUnitDefinitions(Array.isArray(payload.units) ? payload.units : []);
        setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : []);
        setDefaultItemCategoryDefinitions(Array.isArray(payload.defaultItemCategories) ? payload.defaultItemCategories : []);
      } catch {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setUnitDefinitions([]);
        setItemCategoryDefinitions([]);
        setDefaultItemCategoryDefinitions([]);
      }
    };
    void loadStandards();

    return () => {
      isMounted = false;
    };
  }, []);


  const activeProcessDefinitions = useMemo(
    () => sortProcessesByLabel(processDefinitions.filter((definition) => definition.isActive)),
    [processDefinitions],
  );

  const levelOneItemCategories = useMemo(() => getChildren(itemCategoryDefinitions, null, 1), [itemCategoryDefinitions]);

  const selectedLevelOneCategory = useMemo(
    () => levelOneItemCategories.find((item) => item.id === selectedItemLevelOneId) ?? levelOneItemCategories[0] ?? null,
    [levelOneItemCategories, selectedItemLevelOneId],
  );

  const levelTwoItemCategories = useMemo(
    () => (selectedLevelOneCategory ? getChildren(itemCategoryDefinitions, selectedLevelOneCategory.id, 2) : []),
    [itemCategoryDefinitions, selectedLevelOneCategory],
  );

  const selectedLevelTwoCategory = useMemo(
    () => levelTwoItemCategories.find((item) => item.id === selectedItemLevelTwoId) ?? levelTwoItemCategories[0] ?? null,
    [levelTwoItemCategories, selectedItemLevelTwoId],
  );

  const levelThreeItemCategories = useMemo(
    () => (selectedLevelTwoCategory ? getChildren(itemCategoryDefinitions, selectedLevelTwoCategory.id, 3) : []),
    [itemCategoryDefinitions, selectedLevelTwoCategory],
  );


  useEffect(() => {
    if (levelOneItemCategories.length === 0) {
      setSelectedItemLevelOneId(null);
      setSelectedItemLevelTwoId(null);
      return;
    }
    if (!selectedItemLevelOneId || !levelOneItemCategories.some((item) => item.id === selectedItemLevelOneId)) {
      setSelectedItemLevelOneId(levelOneItemCategories[0].id);
    }
  }, [levelOneItemCategories, selectedItemLevelOneId]);

  useEffect(() => {
    if (!selectedLevelOneCategory || levelTwoItemCategories.length === 0) {
      setSelectedItemLevelTwoId(null);
      return;
    }
    if (!selectedItemLevelTwoId || !levelTwoItemCategories.some((item) => item.id === selectedItemLevelTwoId)) {
      setSelectedItemLevelTwoId(levelTwoItemCategories[0].id);
    }
  }, [levelTwoItemCategories, selectedItemLevelTwoId, selectedLevelOneCategory]);

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
      const save = async () => {
        try {
          const payload = await saveAdminItemCategoriesToApi(nextCategories);
          setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : nextCategories);
        } catch {
          setItemInlineError(t("standards.section.saveItemFailed", "생산품 유형 저장에 실패했습니다. 연결 상태를 확인하세요."));
        } finally {
          setItemSavingId(null);
        }
      };
      void save();
    },
    [canManageStandards, t],
  );

  const addItemCategory = useCallback(
    (level: AdminItemCategoryDefinition["level"], parentId: string | null, nameValue: string) => {
      if (!canManageStandards || itemSavingId) return;
      const name = nameValue.trim().replace(/\s+/g, " ");
      if (name.length < 2) {
        setItemInlineError(t("standards.items.nameTooShort", "생산품 유형 이름을 2자 이상 입력하세요."));
        return;
      }

      const normalizedParentId = normalizeParentId(parentId);
      if (level > 1 && !normalizedParentId) {
        setItemInlineError(t("standards.items.parentRequired", "상위 생산품 유형을 먼저 선택하세요."));
        return;
      }
      if (itemCategoryDefinitions.some((item) => item.name.trim() === name && item.level === level && normalizeParentId(item.parent_id) === normalizedParentId)) {
        setItemInlineError(t("standards.items.duplicate", "같은 단계에 이미 등록된 생산품 유형입니다."));
        return;
      }

      const siblings = itemCategoryDefinitions.filter((item) => item.level === level && normalizeParentId(item.parent_id) === normalizedParentId);
      const nextItem: AdminItemCategoryDefinition = {
        id: createClientId(`item_category_l${level}`),
        parent_id: normalizedParentId,
        level,
        name,
        is_active: true,
        sort_order: getNextSortOrder(siblings),
      };

      if (level === 1) setNewItemLevelOneName("");
      if (level === 2) setNewItemLevelTwoName("");
      if (level === 3) setNewItemLevelThreeName("");
      saveItemCategories([...itemCategoryDefinitions, nextItem], "new");
      if (level === 1) setSelectedItemLevelOneId(nextItem.id);
      if (level === 2) setSelectedItemLevelTwoId(nextItem.id);
    },
    [canManageStandards, itemCategoryDefinitions, itemSavingId, saveItemCategories, t],
  );

  const toggleItemCategory = useCallback(
    (itemId: string, nextActive: boolean) => {
      if (!canManageStandards || itemSavingId) return;
      const descendantIds = nextActive ? new Set<string>() : getDescendantIds(itemCategoryDefinitions, itemId);
      const nextCategories = itemCategoryDefinitions.map((item) => {
        if (item.id === itemId || descendantIds.has(item.id)) return { ...item, is_active: nextActive };
        return item;
      });
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

  const submitRequest = useCallback(async () => {
    if (!requestTarget || requestSubmitState === "submitting") return;
    const name = requestName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      setRequestNotice(t("standards.request.nameTooShort", "추가 요청할 항목명을 2자 이상 입력하세요."));
      setRequestSubmitState("failed");
      return;
    }

    setRequestSubmitState("submitting");
    setRequestNotice("");
    try {
      await submitStandardAdditionRequest(requestTarget, name, requestReason);
      setRequestSubmitState("success");
      setRequestName("");
      setRequestReason("");
      setRequestNotice(t("standards.request.success", "추가 요청을 접수했습니다. 처리 결과는 문의 이력에서 확인할 수 있습니다."));
    } catch {
      setRequestSubmitState("failed");
      setRequestNotice(t("standards.request.failed", "추가 요청을 접수하지 못했습니다. 잠시 후 다시 시도하세요."));
    }
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

  const renderUsageToggle = (isActive: boolean, disabled: boolean, onClick: () => void, readOnly = false) => (
    <AdminUsageToggle
      label={isActive ? t("standards.common.active", "사용") : t("standards.common.inactive", "미사용")}
      checked={isActive}
      onChange={() => {
        if (readOnly) return;
        onClick();
      }}
      disabled={disabled}
      readOnly={readOnly}
      activeLabel={t("standards.common.active", "사용")}
      inactiveLabel={t("standards.common.inactive", "미사용")}
      variant="inline"
    />
  );

  const renderCategoryColumn = (
    title: string,
    items: AdminItemCategoryDefinition[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    level: AdminItemCategoryDefinition["level"],
    parentId: string | null,
    newName: string,
    onChangeNewName: (value: string) => void,
    placeholder: string,
  ) => (
    <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-sm">
      <div className="border-b border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">{title}</p>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-[var(--pbp-border)] overflow-auto bg-[var(--pbp-surface)]">
        {items.length > 0 ? items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <div
              key={item.id}
              className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-l-4 px-3 py-2.5 transition ${
                selected
                  ? "border-l-[var(--pbp-brand-soft)] bg-[var(--pbp-selected-surface)] ring-1 ring-inset ring-[var(--pbp-selected-border)]"
                  : "border-l-transparent bg-[var(--pbp-surface)] hover:bg-[var(--pbp-selected-surface-soft)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`min-h-10 min-w-0 rounded-xl px-2 text-left text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] ${
                  selected ? "text-[var(--pbp-text-primary)]" : "text-[var(--pbp-text-primary)]"
                }`}
              >
                <span className="block truncate">{item.name}</span>
              </button>
              {renderUsageToggle(item.is_active, itemSavingId !== null || !canManageStandards, () => toggleItemCategory(item.id, !item.is_active))}
            </div>
          );
        }) : (
          <div className="px-4 py-8 text-center text-sm font-medium text-[var(--pbp-text-muted)]">
            {level === 1 ? t("standards.items.emptyLevelOne", "1차 유형이 없습니다.") : t("standards.items.emptyChildren", "상위 유형에 연결된 항목이 없습니다.")}
          </div>
        )}
      </div>
      {canManageStandards ? (
        <div className="border-t border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(event) => {
                onChangeNewName(event.target.value);
                setItemInlineError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") addItemCategory(level, parentId, newName);
              }}
              placeholder={placeholder}
              disabled={level > 1 && !parentId}
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-field-search-surface)] px-3 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)] disabled:bg-[var(--pbp-surface-muted)] disabled:text-[var(--pbp-text-subtle)]"
            />
            <button
              type="button"
              onClick={() => addItemCategory(level, parentId, newName)}
              disabled={itemSavingId !== null || (level > 1 && !parentId)}
              className="rounded-xl border border-[var(--pbp-action-primary-surface)] bg-[var(--pbp-action-primary-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--pbp-action-primary-text)] transition enabled:hover:bg-[var(--pbp-action-primary-surface-hover)] disabled:border-[var(--pbp-border)] disabled:bg-[var(--pbp-surface)] disabled:text-[var(--pbp-text-muted)] disabled:cursor-default"
            >
              {itemSavingId === "new" ? t("standards.common.saving", "저장 중") : t("standards.items.addShort", "추가")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderItemManagement = () => (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
        {t("standards.items.hierarchyDescription", "생산품 유형은 1차·2차·3차 계층으로 관리합니다. 작업지시서에서는 이 분류를 따라 품목을 선택합니다.")}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {renderCategoryColumn(
          t("standards.items.levelOne", "1차 유형"),
          levelOneItemCategories,
          selectedLevelOneCategory?.id ?? null,
          (id) => {
            setSelectedItemLevelOneId(id);
            setSelectedItemLevelTwoId(null);
            setItemInlineError("");
          },
          1,
          null,
          newItemLevelOneName,
          setNewItemLevelOneName,
          t("standards.items.addLevelOne", "예: 상의, 하의"),
        )}
        {renderCategoryColumn(
          t("standards.items.levelTwo", "2차 유형"),
          levelTwoItemCategories,
          selectedLevelTwoCategory?.id ?? null,
          (id) => {
            setSelectedItemLevelTwoId(id);
            setItemInlineError("");
          },
          2,
          selectedLevelOneCategory?.id ?? null,
          newItemLevelTwoName,
          setNewItemLevelTwoName,
          selectedLevelOneCategory ? t("standards.items.addLevelTwo", "예: 티셔츠, 셔츠") : t("standards.items.selectLevelOne", "1차 유형 선택"),
        )}
        {renderCategoryColumn(
          t("standards.items.levelThree", "3차 유형"),
          levelThreeItemCategories,
          null,
          () => undefined,
          3,
          selectedLevelTwoCategory?.id ?? null,
          newItemLevelThreeName,
          setNewItemLevelThreeName,
          selectedLevelTwoCategory ? t("standards.items.addLevelThree", "예: 반팔 티셔츠") : t("standards.items.selectLevelTwo", "2차 유형 선택"),
        )}
      </div>

      {itemInlineError ? <p className="text-xs font-semibold text-rose-600">{itemInlineError}</p> : null}
    </div>
  );

  const renderReadOnlyRows = (target: StandardRequestTarget) => {
    const isUnitTarget = target === "units";
    const rows = isUnitTarget
      ? sortedUnitDefinitions.map((unit) => ({ id: unit.id, name: unit.name, code: getUnitDisplayCode(unit.name, unit.code), description: getUnitUsageDescription(unit.name), isActive: unit.is_active }))
      : sortedProcessDefinitions.map((process) => ({ id: process.type, name: process.label, code: getProcessDisplayCode(process.label, process.type), description: getProcessUsageDescription(process.label), isActive: process.isActive }));
    const targetTitle = isUnitTarget ? t("standards.actions.units.title", "단위 표준") : t("standards.actions.processes.title", "외주공정 유형");

    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-sm">
          <div className="grid grid-cols-[minmax(120px,0.55fr)_minmax(120px,0.55fr)_minmax(220px,1.35fr)_144px] gap-4 bg-[var(--pbp-surface-muted)] px-4 py-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
            <span>{t("standards.table.name", "이름")}</span>
            <span>{t("standards.table.code", "표기명")}</span>
            <span>{t("standards.table.description", "사용처")}</span>
            <span className="text-right">{t("standards.table.status", "사용 여부")}</span>
          </div>
          <div className="max-h-[420px] overflow-auto divide-y divide-[var(--pbp-border)] bg-[var(--pbp-surface)]">
            {rows.length > 0 ? rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[minmax(120px,0.55fr)_minmax(120px,0.55fr)_minmax(220px,1.35fr)_144px] items-center gap-4 px-4 py-3 text-sm">
                <span className="truncate font-semibold text-[var(--pbp-text-primary)]">{row.name}</span>
                <span className="truncate text-xs font-semibold text-[var(--pbp-brand-primary)]">{row.code}</span>
                <span className="min-w-0 truncate text-xs font-medium text-[var(--pbp-text-muted)]">{row.description}</span>
                <span className="flex justify-end">{renderUsageToggle(row.isActive, false, () => undefined, true)}</span>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm font-medium text-[var(--pbp-text-muted)]">{emptyDbLabel}</div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">{t("standards.request.panelTitle", "유형 추가 요청")}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                {isUnitTarget
                  ? t("standards.units.requestDescription", "필요한 단위가 없으면 시스템관리자에게 추가를 요청합니다.")
                  : t("standards.processes.requestDescription", "필요한 외주공정이 없으면 시스템관리자에게 추가를 요청합니다.")}
              </p>
            </div>
            <span className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pbp-text-muted)]">{targetTitle}</span>
          </div>

          {canManageStandards ? (
            <div className="mt-4 space-y-2">
              <input
                value={requestTarget === target ? requestName : ""}
                onFocus={() => {
                  if (requestTarget !== target) openRequestPanel(target);
                }}
                onChange={(event) => {
                  if (requestTarget !== target) openRequestPanel(target);
                  setRequestName(event.target.value);
                }}
                placeholder={isUnitTarget ? t("standards.request.unitPlaceholder", "예: 마, SET") : t("standards.request.processPlaceholder", "예: 프린트, 워싱")}
                className="min-h-10 w-full rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-field-search-surface)] px-3 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)]"
              />
              <textarea
                value={requestTarget === target ? requestReason : ""}
                onFocus={() => {
                  if (requestTarget !== target) openRequestPanel(target);
                }}
                onChange={(event) => {
                  if (requestTarget !== target) openRequestPanel(target);
                  setRequestReason(event.target.value);
                }}
                placeholder={t("standards.request.reasonPlaceholder", "요청 사유 또는 사용 예시")}
                rows={4}
                className="w-full resize-none rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-field-search-surface)] px-3 py-2.5 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)]"
              />
              <div className="flex justify-end gap-2">
                {requestTarget === target ? (
                  <AdminButton type="button" variant="secondary" size="md" onClick={closeRequestPanel}>
                    {t("common.cancel", "취소")}
                  </AdminButton>
                ) : null}
                <AdminButton
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (requestTarget !== target) {
                      openRequestPanel(target);
                      return;
                    }
                    submitRequest();
                  }}
                  disabled={requestTarget === target && requestSubmitState === "submitting"}
                  className="disabled:opacity-70"
                >
                  {requestTarget === target && requestSubmitState === "submitting" ? t("standards.request.submitting", "접수 중") : t("standards.request.submit", "요청하기")}
                </AdminButton>
              </div>
              {requestTarget === target && requestNotice ? (
                <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${requestSubmitState === "success" ? "bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]" : "bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]"}`}>{requestNotice}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
              {t("standards.request.readonly", "기준정보 추가 요청 권한이 없습니다.")}
            </p>
          )}
        </aside>
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

      <WaflSectionPanel
        eyebrow={t("standards.section.standardEyebrow", "기준정보 설정")}
        title={t("standards.section.standardTitle", "기준 관리")}
        description={t("standards.section.standardDescription", "생산품 유형은 직접 관리하고, 단위·외주공정 유형은 요청으로 운영합니다.")}
        meta={<AdminStatusBadge tone="brand" size="sm">{selectedTab.title}</AdminStatusBadge>}
        density="standard"
        headerClassName="min-h-[112px]"
        bodyClassName="pt-4"
      >
        <WaflSettingsTabs
          items={tabs.map((tab) => ({ id: tab.key, title: tab.title, description: tab.description, tone: tab.key === "items" ? "brand" : tab.key === "units" ? "info" : "success" }))}
          activeId={activeStandardTab}
          onChange={(id) => {
            setActiveStandardTab(id);
            setRequestTarget(null);
            setRequestNotice("");
          }}
          ariaLabel={t("standards.section.tabsAria", "기준정보 설정 탭")}
          gridClassName="grid gap-2 sm:grid-cols-3"
        />

        {hasMissingDbStandards ? (
          <div className="mt-3 rounded-2xl border border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] px-4 py-3 text-xs leading-5 text-[var(--pbp-status-warning-fg)]">
            {t("standards.section.missingSeedNotice", "일부 기준정보가 비어 있습니다. 필요한 항목은 탭 안에서 직접 관리하거나 요청하세요.")}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">{selectedTab.title}</p>
          <p className="text-xs font-medium text-[var(--pbp-text-muted)]">{selectedTab.description}</p>
        </div>

        <div className="mt-2.5">{renderSelectedStandardPanel()}</div>
      </WaflSectionPanel>

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
