import { useEffect, useMemo, useRef, useState } from "react";

import { AppBadge, AppSelect, WaflButton, WaflInput, WaflSurface, type AppSelectOption } from "@/components/common/ui";
import { SectionCountBadge } from "@/components/common/ui";
import { WorkOrderMoreIconButton } from "@/components/workorder/common/WorkOrderIconButtons";
import {
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_PANEL_DIVIDER_CLASS,
  MATERIAL_ORDER_LIST_CLEAR_BUTTON_CLASS,
  MATERIAL_ORDER_LIST_CONTROL_ROW_CLASS,
  MATERIAL_ORDER_LIST_SEARCH_ROW_CLASS,
  MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import {
  formatMaterialOrderDisplayTitle,
  formatMaterialOrderPrimaryLineLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderStatusBadgeTone,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
import {
  filterMaterialOrders,
  formatMaterialOrderDraftLineLabel,
  type MaterialOrderFilterStatus,
  type MaterialOrderFilterType,
} from "@/features/material-orders/materialOrderPanelUtils";
import type { MaterialOrder, MaterialOrderLineItemType, MaterialOrderStatus } from "@/lib/material-orders/types";
import type { MaterialOrderDraftLine, MaterialOrderDraftSelectionType } from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderListPanelProps = {
  variant?: "panel" | "drawer";
  orders: MaterialOrder[];
  selectedOrderId: string;
  loading: boolean;
  errorMessage: string | null;
  creating: boolean;
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
  onCancelOrder: (orderId: string) => void;
  onRetry: () => void;
  selectedDraftMaterialType: MaterialOrderDraftSelectionType;
  selectedDraftSupplierName: string | null;
  selectedDraftLines: MaterialOrderDraftLine[];
};

const MATERIAL_ORDER_STATUS_OPTIONS: Array<AppSelectOption & { value: "all" | MaterialOrderStatus }> = [
  { value: "all", label: "상태 전체" },
  { value: "draft", label: "작성중" },
  { value: "review_requested", label: "검토요청" },
  { value: "approved", label: "발주요청" },
  { value: "order_placed", label: "발주완료" },
  { value: "rejected", label: "반려" },
  { value: "cancelled", label: "취소" },
];

const MATERIAL_ORDER_TYPE_OPTIONS: Array<AppSelectOption & { value: "all" | MaterialOrderLineItemType }> = [
  { value: "all", label: "종류 전체" },
  { value: "fabric", label: "원단" },
  { value: "submaterial", label: "부자재" },
];

export default function MaterialOrderListPanel({
  variant = "panel",
  orders,
  selectedOrderId,
  loading,
  errorMessage,
  creating,
  onSelectOrder,
  onCreateOrder,
  onCancelOrder,
  onRetry,
  selectedDraftMaterialType,
  selectedDraftSupplierName,
  selectedDraftLines,
}: MaterialOrderListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialOrderFilterStatus>("draft");
  const [typeFilter, setTypeFilter] = useState<MaterialOrderFilterType>("all");

  const filteredOrders = useMemo(() => (
    filterMaterialOrders({
      orders,
      searchQuery,
      statusFilter,
      typeFilter,
    })
  ), [orders, searchQuery, statusFilter, typeFilter]);

  const listContent = (
    <>
      <div className="shrink-0">
        <div className="flex items-end justify-between gap-2 pb-2.5">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">발주서 목록</h2>
          <SectionCountBadge className="translate-y-0.5">{filteredOrders.length}건</SectionCountBadge>
        </div>
        <div className={MATERIAL_ORDER_PANEL_DIVIDER_CLASS} aria-hidden="true" />
      </div>

      <div className={`mt-3 ${MATERIAL_ORDER_LIST_CONTROL_ROW_CLASS}`}>
        <div className={MATERIAL_ORDER_LIST_SEARCH_ROW_CLASS}>
          <label className="min-w-0 flex-1">
            <span className="sr-only">발주서 검색</span>
            <WaflInput
              type="search"
              fieldSize="sm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="공급처·품목·작업지시서 검색"
              className={MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS}
            />
          </label>
          {searchQuery ? (
            <WaflButton
              onClick={() => setSearchQuery("")}
              variant="secondary"
              size="sm"
              className={MATERIAL_ORDER_LIST_CLEAR_BUTTON_CLASS}
            >
              지우기
            </WaflButton>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AppSelect
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as MaterialOrderFilterType)}
            options={MATERIAL_ORDER_TYPE_OPTIONS}
            size="sm"
            ariaLabel="자재 종류 필터"
            triggerClassName={MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS}
          />
          <AppSelect
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MaterialOrderFilterStatus)}
            options={MATERIAL_ORDER_STATUS_OPTIONS}
            size="sm"
            ariaLabel="발주 상태 필터"
            triggerClassName={MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS}
          />
        </div>
        <WaflButton
          size="md"
          variant="primary"
          width="full"
          className="pbp-touch-target mt-0"
          disabled={creating}
          title={creating ? "새 발주서를 생성하고 있습니다." : "새 원단·부자재 발주서를 생성합니다."}
          aria-label={creating ? "새 발주서 생성 중" : "새 원단·부자재 발주서 생성"}
          onClick={onCreateOrder}
        >
          {creating ? "생성 중" : "새 발주서 생성"}
        </WaflButton>
        <div className={`mt-3 ${MATERIAL_ORDER_PANEL_DIVIDER_CLASS}`} aria-hidden="true" />
      </div>

      <div className={variant === "panel" ? MATERIAL_ORDER_PANEL_LIST_CLASS : "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0"}>
        {loading ? (
          <MaterialOrderPanelMessage title="불러오는 중" description="원단·부자재 발주서를 조회하고 있습니다." kind="loading" />
        ) : errorMessage ? (
          <MaterialOrderPanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} kind="error" />
        ) : orders.length === 0 ? (
          <MaterialOrderPanelMessage
            title="등록된 발주서 없음"
            description="새 발주서 생성 버튼으로 공급처별 발주서를 시작합니다."
          />
        ) : filteredOrders.length === 0 ? (
          <MaterialOrderPanelMessage title="검색 결과 없음" kind="search" />
        ) : (
          filteredOrders.map((order) => (
            <MaterialOrderListButton
              key={order.id}
              order={order}
              selected={order.id === selectedOrderId}
              onSelectOrder={onSelectOrder}
              draftMaterialType={order.id === selectedOrderId ? selectedDraftMaterialType : null}
              draftSupplierName={order.id === selectedOrderId ? selectedDraftSupplierName : null}
              draftLines={order.id === selectedOrderId ? selectedDraftLines : null}
              onCancelOrder={onCancelOrder}
            />
          ))
        )}
      </div>
    </>
  );

  if (variant === "drawer") {
    return <div className="flex h-full min-h-0 flex-col overflow-hidden">{listContent}</div>;
  }

  return (
    <WaflSurface component="material-order-list-panel" className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      {listContent}
    </WaflSurface>
  );
}

function MaterialOrderListButton({
  order,
  selected,
  onSelectOrder,
  onCancelOrder,
  draftMaterialType,
  draftSupplierName,
  draftLines,
}: {
  order: MaterialOrder;
  selected: boolean;
  onSelectOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  draftMaterialType: MaterialOrderDraftSelectionType | null;
  draftSupplierName: string | null;
  draftLines: MaterialOrderDraftLine[] | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const materialType = draftMaterialType ?? resolveMaterialOrderType(order);
  const supplierLabel = draftSupplierName?.trim() || order.supplierPartnerName?.trim() || "공급처 미지정";
  const displayTitle = selected ? `${formatMaterialOrderTypeLabel(materialType)} · ${supplierLabel}` : formatMaterialOrderDisplayTitle(order);
  const primaryLineLabel = draftLines ? formatMaterialOrderDraftLineLabel(draftLines) : formatMaterialOrderPrimaryLineLabel(order);
  const canCancelOrder = order.status === "draft";

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleCancelOrder = () => {
    setMenuOpen(false);
    const confirmed = window.confirm("이 발주서를 삭제하시겠습니까? 삭제한 발주서는 취소 상태로 이동합니다.");
    if (!confirmed) return;
    onCancelOrder(order.id);
  };

  return (
    <WaflSurface
      component="material-order-list-card"
      shape="control"
      tone={selected ? "selected" : "surface"}
      data-wafl-state={selected ? "selected" : "normal"}
      className="pbp-interactive-card w-full p-3 transition-all duration-150"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <button
          type="button"
          className="pbp-touch-target pbp-press-subtle min-w-0 flex-1 text-left"
          onClick={() => onSelectOrder(order.id)}
        >
          <p className="truncate text-sm font-semibold pbp-text-primary">{displayTitle}</p>
          <p className="mt-1 truncate text-[11px] pbp-text-muted">{primaryLineLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <AppBadge tone={resolveMaterialOrderStatusBadgeTone(order.status)} size="sm" className="shrink-0">
              {formatMaterialOrderStatusLabel(order.status)}
            </AppBadge>
          </div>
        </button>
        <div className="relative shrink-0" ref={menuRef}>
          <WorkOrderMoreIconButton
            label="발주서 작업 더보기"
            onClick={() => {
              if (canCancelOrder) setMenuOpen((current) => !current);
            }}
            disabled={!canCancelOrder}
            active={selected}
            size="md"
            aria-haspopup="menu"
            aria-expanded={canCancelOrder && menuOpen}
          />
          {menuOpen && canCancelOrder ? (
            <div
              role="menu"
              className={`absolute right-0 top-10 z-20 min-w-[132px] wafl-shape-control border p-1 ${
                selected
                  ? "border-[var(--pbp-text-primary)] bg-[var(--pbp-text-primary)] text-[var(--pbp-surface)]"
                  : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]"
              }`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleCancelOrder}
                className={`flex w-full items-center wafl-shape-control px-3 py-2 text-left text-sm ${
                  selected
                    ? "text-[var(--pbp-status-danger-bg)] hover:bg-white/10"
                    : "text-[var(--pbp-status-danger-fg)] hover:bg-[var(--pbp-status-danger-bg)]"
                }`}
              >
                삭제
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex w-full min-w-0 items-center justify-between gap-2 border-t border-[var(--pbp-border)] pt-2 text-[11px] font-semibold pbp-text-subtle">
        <span>{formatMaterialOrderTypeLabel(materialType)}</span>
        <span className="truncate">{supplierLabel}</span>
      </div>
    </WaflSurface>
  );
}
