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
      eyebrow="Draft editor"
      title="발주 작성/상세 1차"
      description="발주 종류와 공급처를 먼저 선택하고, 품목 라인은 품목명·단위·수량·단가만 입력합니다. 작업지시서 연결/배분 상세 저장은 다음 단계에서 붙입니다."
      actions={<AdminStatusBadge tone="warning">Local draft</AdminStatusBadge>}
      className="p-5"
      bodyClassName="mt-5"
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="space-y-4">
          <AdminCard className="p-4">
            <h3 className="text-sm font-semibold pbp-text-primary">발주 기본 정보</h3>
            <div className="mt-4 grid gap-3">
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
              {selectedSupplier ? (
                <p className="rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
                  {selectedSupplier.helperText}
                </p>
              ) : null}
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
                  className={fieldClassName("min-h-[96px] resize-none")}
                />
              </label>
            </div>
          </AdminCard>

          <AdminCard className="p-4">
            <h3 className="text-sm font-semibold pbp-text-primary">입력 순서</h3>
            <div className="mt-4 space-y-3">
              {guideItems.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pbp-surface)] text-[11px] font-semibold pbp-text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-semibold pbp-text-primary">{item.label}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 pbp-text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold pbp-text-primary">품목 라인</h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">{materialTypeLabels[materialType]} 발주 품목을 빠르게 입력합니다. 색상·규격은 필요하면 품목명에 함께 적고, 배분 수량은 작업지시서 연결 단계에서 입력합니다.</p>
              </div>
              <AdminButton onClick={addLine}>품목 추가</AdminButton>
            </div>

            <div className="mt-4 space-y-3">
              {lines.map((line, index) => {
                const lineAmount = calculateMaterialOrderLineAmount(line);

                return (
                  <div key={line.id} className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Line {index + 1}</p>
                        <p className="mt-1 text-sm font-semibold pbp-text-primary">{line.itemName || "품목명 미입력"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <AdminStatusBadge tone="neutral">{materialTypeLabels[materialType]}</AdminStatusBadge>
                        <AdminStatusBadge tone="info">{line.orderQuantity}{line.unit}</AdminStatusBadge>
                        <AdminButton
                          variant="ghost"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 1}
                        >
                          삭제
                        </AdminButton>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                        품목명
                        <input
                          value={line.itemName}
                          onChange={(event) => updateLine(line.id, { itemName: event.target.value })}
                          placeholder={materialType === "fabric" ? "예: 30수 면 블랙" : "예: YKK 3호 지퍼 아이보리"}
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                        단위
                        <input
                          value={line.unit}
                          onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                          placeholder="마, 개, 야드"
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                        주문수량
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.orderQuantity}
                          onChange={(event) => updateLine(line.id, { orderQuantity: normalizeNumberInput(event.target.value) })}
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
                        단가
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.unitPrice}
                          onChange={(event) => updateLine(line.id, { unitPrice: normalizeNumberInput(event.target.value) })}
                          className={fieldClassName()}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-[var(--pbp-surface-soft)] p-3 text-xs md:grid-cols-2">
                      <div>
                        <p className="font-semibold pbp-text-subtle">라인 금액</p>
                        <p className="mt-1 text-sm font-semibold pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</p>
                      </div>
                      <div>
                        <p className="font-semibold pbp-text-subtle">계산식</p>
                        <p className="mt-1 text-sm font-semibold pbp-text-primary">주문 {line.orderQuantity}{line.unit} × 단가 {formatMaterialOrderAmount(line.unitPrice)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
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
            <div className="mt-4 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
              작업지시서별 배분 수량과 남은 재고 예정 수량은 다음 단계의 배분 입력 화면에서 계산합니다.
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AdminButton disabled>임시 저장 예정</AdminButton>
              <AdminButton variant="primary" disabled>검토 요청 예정</AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminSection>
  );
}
