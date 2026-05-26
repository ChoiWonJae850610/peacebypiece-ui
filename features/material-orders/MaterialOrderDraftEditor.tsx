"use client";

import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard, AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  calculateMaterialOrderDraftTotals,
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderDraftEditorProps = {
  guideItems: {
    id: string;
    label: string;
    description: string;
  }[];
};

type MaterialOrderSupplierOption = {
  id: string;
  materialType: MaterialOrderDraftType;
  label: string;
  helperText: string;
};

type MaterialOrderListItem = {
  id: string;
  code: string;
  materialType: MaterialOrderDraftType;
  supplierName: string;
  statusLabel: string;
  amountLabel: string;
  createdAtLabel: string;
};

type AllocationCandidateWorkOrder = {
  id: string;
  code: string;
  productName: string;
  reorderLabel: string;
  requestedMaterialLabel: string;
  dueDateLabel: string;
};

const materialTypeLabels: Record<MaterialOrderDraftType, string> = {
  fabric: "원단",
  submaterial: "부자재",
};

const supplierOptions: MaterialOrderSupplierOption[] = [
  {
    id: "fabric-supplier-a",
    materialType: "fabric",
    label: "A 원단",
    helperText: "원단 공급처 예시입니다. 실제 거래처 필터는 다음 단계에서 DB와 연결합니다.",
  },
  {
    id: "fabric-supplier-b",
    materialType: "fabric",
    label: "B 원단",
    helperText: "원단 공급처 예시입니다.",
  },
  {
    id: "submaterial-supplier-a",
    materialType: "submaterial",
    label: "A 부자재",
    helperText: "부자재 공급처 예시입니다. 실제 거래처 필터는 다음 단계에서 DB와 연결합니다.",
  },
];

const draftOrderList: MaterialOrderListItem[] = [
  {
    id: "draft-material-order-1",
    code: "MO-0001",
    materialType: "fabric",
    supplierName: "A 원단",
    statusLabel: "작성중",
    amountLabel: "₩0",
    createdAtLabel: "오늘",
  },
  {
    id: "draft-material-order-2",
    code: "MO-0002",
    materialType: "submaterial",
    supplierName: "A 부자재",
    statusLabel: "검토대기",
    amountLabel: "₩0",
    createdAtLabel: "예시",
  },
];

const allocationCandidates: AllocationCandidateWorkOrder[] = [
  {
    id: "allocation-candidate-1",
    code: "WO-001",
    productName: "셔츠 샘플",
    reorderLabel: "초도",
    requestedMaterialLabel: "원단 미배분",
    dueDateLabel: "납기 미정",
  },
  {
    id: "allocation-candidate-2",
    code: "WO-002",
    productName: "팬츠 리오더",
    reorderLabel: "리오더 1차",
    requestedMaterialLabel: "부자재 미배분",
    dueDateLabel: "납기 미정",
  },
];

const initialLines: MaterialOrderDraftLine[] = [
  {
    id: "draft-line-1",
    itemName: "30수 면 블랙",
    unit: "마",
    orderQuantity: 10,
    unitPrice: 0,
  },
];

function createEmptyLine(index: number): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${index}`,
    itemName: "",
    unit: "마",
    orderQuantity: 0,
    unitPrice: 0,
  };
}

function normalizeNumberInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fieldClassName(extra = "") {
  return [
    "min-h-10 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]",
    extra,
  ].filter(Boolean).join(" ");
}

export default function MaterialOrderDraftEditor({ guideItems }: MaterialOrderDraftEditorProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(draftOrderList[0]?.id ?? "");
  const [materialType, setMaterialType] = useState<MaterialOrderDraftType>("fabric");
  const [supplierId, setSupplierId] = useState("fabric-supplier-a");
  const [destinationMemo, setDestinationMemo] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [lines, setLines] = useState<MaterialOrderDraftLine[]>(initialLines);

  const filteredSupplierOptions = useMemo(
    () => supplierOptions.filter((supplier) => supplier.materialType === materialType),
    [materialType],
  );

  const selectedSupplier = filteredSupplierOptions.find((supplier) => supplier.id === supplierId) ?? filteredSupplierOptions[0];
  const totals = useMemo(() => calculateMaterialOrderDraftTotals(lines), [lines]);

  function updateMaterialType(nextMaterialType: MaterialOrderDraftType) {
    setMaterialType(nextMaterialType);
    setSupplierId(supplierOptions.find((supplier) => supplier.materialType === nextMaterialType)?.id ?? "");
  }

  function updateLine(lineId: string, patch: Partial<MaterialOrderDraftLine>) {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, createEmptyLine(current.length + 1)]);
  }

  function removeLine(lineId: string) {
    setLines((current) => current.length > 1 ? current.filter((line) => line.id !== lineId) : current);
  }

  return (
    <AdminSection
      eyebrow="Material order desk"
      title="원단·부자재 발주 작업대"
      description="발주서 목록, 선택 발주서 상세, 작업지시서 배분 후보를 한 화면에서 나누어 보는 3패널 구조입니다. 현재는 DB 저장 전 로컬 draft 구조입니다."
      actions={<AdminStatusBadge tone="warning">Local draft</AdminStatusBadge>}
      className="p-5"
      bodyClassName="mt-5"
    >
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <AdminCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold pbp-text-primary">발주서 목록</h3>
              <p className="mt-1 text-xs leading-5 pbp-text-muted">발주 요청서를 선택해 가운데 패널에서 상세를 편집합니다.</p>
            </div>
            <AdminButton size="sm" disabled>새 발주</AdminButton>
          </div>

          <div className="mt-4 space-y-2">
            {draftOrderList.map((order) => {
              const isSelected = order.id === selectedOrderId;

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={[
                    "w-full rounded-3xl border px-4 py-3 text-left transition",
                    isSelected
                      ? "border-[var(--pbp-action-primary)] bg-[var(--pbp-surface-soft)] shadow-sm"
                      : "border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] hover:bg-[var(--pbp-surface-soft)]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold pbp-text-primary">{order.code}</span>
                    <AdminStatusBadge tone={isSelected ? "info" : "neutral"}>{order.statusLabel}</AdminStatusBadge>
                  </div>
                  <p className="mt-2 text-xs font-medium pbp-text-primary">{materialTypeLabels[order.materialType]} · {order.supplierName}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs pbp-text-muted">
                    <span>{order.createdAtLabel}</span>
                    <span>{order.amountLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold pbp-text-primary">선택 발주서 상세</h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">기본 정보는 좁게 유지하고, 품목 라인은 표 형태에 가깝게 빠르게 입력합니다.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminStatusBadge tone="neutral">작성중</AdminStatusBadge>
                <AdminStatusBadge tone="info">{materialTypeLabels[materialType]}</AdminStatusBadge>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                  발주 종류
                  <select
                    value={materialType}
                    onChange={(event) => updateMaterialType(event.target.value as MaterialOrderDraftType)}
                    className={fieldClassName()}
                  >
                    <option value="fabric">원단</option>
                    <option value="submaterial">부자재</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                  공급처
                  <select
                    value={selectedSupplier?.id ?? ""}
                    onChange={(event) => setSupplierId(event.target.value)}
                    className={fieldClassName()}
                  >
                    {filteredSupplierOptions.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                  전달/보관 메모
                  <input
                    value={destinationMemo}
                    onChange={(event) => setDestinationMemo(event.target.value)}
                    placeholder="예: B 봉제 전달, 남은 수량 고객사 보관"
                    className={fieldClassName()}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                  내부 메모
                  <textarea
                    value={orderNote}
                    onChange={(event) => setOrderNote(event.target.value)}
                    placeholder="단가/검토/발주 조건 등 내부 확인용 메모"
                    className={fieldClassName("min-h-[88px] resize-none")}
                  />
                </label>
              </div>
            </div>
            {selectedSupplier ? (
              <p className="mt-3 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
                {selectedSupplier.helperText}
              </p>
            ) : null}
          </AdminCard>

          <AdminCard className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold pbp-text-primary">품목 라인</h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">라인별 계산 설명은 제거하고, 금액과 배분 상태만 간단히 표시합니다.</p>
              </div>
              <AdminButton onClick={addLine}>품목 추가</AdminButton>
            </div>

            <div className="mt-4 overflow-x-auto rounded-3xl border border-[var(--pbp-border)]">
              <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead className="bg-[var(--pbp-surface-soft)] text-xs font-semibold pbp-text-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left">품목명</th>
                    <th className="px-3 py-3 text-left">단위</th>
                    <th className="px-3 py-3 text-right">수량</th>
                    <th className="px-3 py-3 text-right">단가</th>
                    <th className="px-3 py-3 text-right">금액</th>
                    <th className="px-4 py-3 text-center">배분</th>
                    <th className="px-4 py-3 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pbp-border)]">
                  {lines.map((line) => {
                    const lineAmount = calculateMaterialOrderLineAmount(line);

                    return (
                      <tr key={line.id} className="bg-[var(--pbp-surface-base)] align-middle">
                        <td className="px-4 py-3">
                          <input
                            value={line.itemName}
                            onChange={(event) => updateLine(line.id, { itemName: event.target.value })}
                            placeholder={materialType === "fabric" ? "예: 30수 면 블랙" : "예: YKK 3호 지퍼 아이보리"}
                            className={fieldClassName("min-w-[220px]")}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={line.unit}
                            onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                            placeholder="마"
                            className={fieldClassName("w-20")}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.orderQuantity}
                            onChange={(event) => updateLine(line.id, { orderQuantity: normalizeNumberInput(event.target.value) })}
                            className={fieldClassName("w-24 text-right")}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={line.unitPrice}
                            onChange={(event) => updateLine(line.id, { unitPrice: normalizeNumberInput(event.target.value) })}
                            className={fieldClassName("w-28 text-right")}
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-semibold pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <AdminStatusBadge tone="neutral">미배분</AdminStatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AdminButton
                            variant="ghost"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length <= 1}
                          >
                            삭제
                          </AdminButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 rounded-3xl bg-[var(--pbp-surface-soft)] p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold pbp-text-subtle">품목 수</p>
                <p className="mt-1 text-lg font-semibold pbp-text-primary">{totals.lineCount}개</p>
              </div>
              <div>
                <p className="text-xs font-semibold pbp-text-subtle">주문수량 합계</p>
                <p className="mt-1 text-lg font-semibold pbp-text-primary">{totals.totalOrderQuantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold pbp-text-subtle">금액 합계</p>
                <p className="mt-1 text-lg font-semibold pbp-text-primary">{formatMaterialOrderAmount(totals.totalAmount)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AdminButton disabled>임시 저장 예정</AdminButton>
              <AdminButton variant="primary" disabled>검토 요청 예정</AdminButton>
            </div>
          </AdminCard>
        </div>

        <AdminCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold pbp-text-primary">작업지시서 연결/배분</h3>
              <p className="mt-1 text-xs leading-5 pbp-text-muted">자재가 아직 배분되지 않은 작업지시서를 선택해 발주 품목과 연결할 영역입니다.</p>
            </div>
            <AdminStatusBadge tone="neutral">다음 단계</AdminStatusBadge>
          </div>

          <div className="mt-4 space-y-3">
            {allocationCandidates.map((workOrder) => (
              <div key={workOrder.id} className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold pbp-text-primary">{workOrder.code}</p>
                    <p className="mt-1 text-xs pbp-text-muted">{workOrder.productName} · {workOrder.reorderLabel}</p>
                  </div>
                  <AdminStatusBadge tone="warning">미연결</AdminStatusBadge>
                </div>
                <div className="mt-3 grid gap-2 text-xs pbp-text-muted">
                  <p>{workOrder.requestedMaterialLabel}</p>
                  <p>{workOrder.dueDateLabel}</p>
                </div>
                <div className="mt-4 grid gap-2">
                  <select className={fieldClassName()} disabled>
                    <option>연결할 품목 라인 선택 예정</option>
                  </select>
                  <input className={fieldClassName()} disabled placeholder="배분 수량 입력 예정" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
            다음 버전에서 선택한 품목 라인별 작업지시서 배분 수량을 입력하고, 주문수량 대비 남은 수량을 재고 예정 수량으로 계산합니다.
          </div>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {guideItems.map((item, index) => (
          <AdminCard key={item.id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pbp-surface-soft)] text-[11px] font-semibold pbp-text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-sm font-semibold pbp-text-primary">{item.label}</p>
            </div>
            <p className="mt-2 text-xs leading-5 pbp-text-muted">{item.description}</p>
          </AdminCard>
        ))}
      </div>
    </AdminSection>
  );
}
