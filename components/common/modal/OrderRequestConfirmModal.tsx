"use client";

import { useMemo, type ReactNode } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
import { MODAL_ACTION_LABELS } from "@/components/common/modal/modalActions";
import {
  getOrderEntriesByTargetType,
  getOrderSubmissionSnapshot,
} from "@/lib/workorder/orderSubmission";
import { useI18n } from "@/lib/i18n";
import {
  MATERIAL_KIND,
  ORDER_ENTRY_TARGET_TYPE,
  ORDER_ENTRY_TARGET_TYPE_LABELS,
} from "@/lib/constants/workorderDomain";
import type { Attachment, Material, OrderEntry, WorkOrder } from "@/types/workorder";

function formatCurrency(value: number) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `${numeric.toLocaleString()}원`;
}

function formatCount(value: number, suffix = "건") {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return `0${suffix}`;
  }
  return `${numeric.toLocaleString()}${suffix}`;
}

function formatQuantity(value: number, suffix?: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return suffix ? `${numeric.toLocaleString()} ${suffix}` : numeric.toLocaleString();
}

function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((total, item) => total + Math.max(0, Number(getter(item) ?? 0) || 0), 0);
}

function getRepresentativeImage(attachments: Attachment[]) {
  return attachments.find((attachment) => attachment.type === "image") ?? null;
}

function getAttachmentTypeBadge(attachment: Attachment) {
  return attachment.type === "image" ? "이미지" : "PDF";
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <div className="text-[11px] font-medium text-stone-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-stone-900">{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-stone-100 pb-2">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {badge ? (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">{badge}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-900">{value}</span>
    </div>
  );
}

function MaterialRow({ material }: { material: Material }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900">{material.name || "-"}</div>
          <div className="mt-1 text-xs text-stone-500">{material.vendor || "-"}</div>
        </div>
        <div className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-stone-600">
          {material.type || "-"}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-stone-500">수량</div>
          <div className="mt-0.5 font-medium text-stone-900">{formatQuantity(material.quantity, material.unit || "")}</div>
        </div>
        <div>
          <div className="text-stone-500">단위</div>
          <div className="mt-0.5 font-medium text-stone-900">{material.unit || "-"}</div>
        </div>
        <div>
          <div className="text-stone-500">단가</div>
          <div className="mt-0.5 font-medium text-stone-900">{formatCurrency(material.unitCost)}</div>
        </div>
        <div>
          <div className="text-stone-500">소계</div>
          <div className="mt-0.5 font-semibold text-stone-900">{formatCurrency(material.totalCost)}</div>
        </div>
      </div>
    </div>
  );
}

function FactoryEntryRow({ entry }: { entry: OrderEntry }) {
  const subtotal = Math.max(0, Number(entry.laborCost ?? 0) || 0) + Math.max(0, Number(entry.lossCost ?? 0) || 0);

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900">{entry.factory?.trim() || "-"}</div>
          <div className="mt-1 text-xs text-stone-500">납기일 {entry.dueDate?.trim() || "-"}</div>
        </div>
        <div className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-stone-600">
          {ORDER_ENTRY_TARGET_TYPE_LABELS[entry.targetType] ?? ORDER_ENTRY_TARGET_TYPE_LABELS[ORDER_ENTRY_TARGET_TYPE.factory]}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-stone-500">수량</div>
          <div className="mt-0.5 font-medium text-stone-900">{formatQuantity(entry.quantity)}</div>
        </div>
        <div>
          <div className="text-stone-500">공임비</div>
          <div className="mt-0.5 font-medium text-stone-900">{formatCurrency(entry.laborCost)}</div>
        </div>
        <div>
          <div className="text-stone-500">로스비</div>
          <div className="mt-0.5 font-medium text-stone-900">{formatCurrency(entry.lossCost)}</div>
        </div>
        <div>
          <div className="text-stone-500">소계</div>
          <div className="mt-0.5 font-semibold text-stone-900">{formatCurrency(subtotal)}</div>
        </div>
      </div>
    </div>
  );
}

export default function OrderRequestConfirmModal({
  open,
  workOrder,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workOrder: WorkOrder;
  onClose: () => void;
  onConfirm: (payload: { factoryName: string; quantity: number }) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.orderRequestConfirm;
  const requested = workOrder.factoryOrderRequest ?? null;
  const submissionSnapshot = useMemo(() => getOrderSubmissionSnapshot(workOrder), [workOrder]);
  const confirmedFactoryName = requested?.factoryName?.trim() || submissionSnapshot.factoryName;
  const confirmedDueDate = submissionSnapshot.dueDate;
  const confirmedQuantity = requested?.quantity ?? submissionSnapshot.quantity;
  const canSubmit = Boolean(confirmedFactoryName) && Boolean(confirmedDueDate) && confirmedQuantity > 0 && !requested;

  const orderEntriesByTarget = useMemo(() => getOrderEntriesByTargetType(workOrder.orderEntries), [workOrder.orderEntries]);

  const factoryEntries = orderEntriesByTarget[ORDER_ENTRY_TARGET_TYPE.factory] ?? [];
  const fabricMaterials = useMemo(
    () => (workOrder.materials ?? []).filter((material) => material.type === MATERIAL_KIND.fabric),
    [workOrder.materials],
  );
  const subsidiaryMaterials = useMemo(
    () => (workOrder.materials ?? []).filter((material) => material.type === MATERIAL_KIND.subsidiary),
    [workOrder.materials],
  );

  const attachmentItems = useMemo(() => workOrder.attachments ?? [], [workOrder.attachments]);
  const representativeImage = useMemo(() => getRepresentativeImage(attachmentItems), [attachmentItems]);

  const factoryQuantityTotal = sumBy(factoryEntries, (entry) => entry.quantity);
  const factoryLaborCostTotal = sumBy(factoryEntries, (entry) => entry.laborCost);
  const factoryLossCostTotal = sumBy(factoryEntries, (entry) => entry.lossCost);
  const factoryAmountTotal = factoryLaborCostTotal + factoryLossCostTotal;

  const fabricQuantityTotal = sumBy(fabricMaterials, (material) => material.quantity);
  const fabricAmountTotal = sumBy(fabricMaterials, (material) => material.totalCost || material.quantity * material.unitCost);

  const subsidiaryQuantityTotal = sumBy(subsidiaryMaterials, (material) => material.quantity);
  const subsidiaryAmountTotal = sumBy(subsidiaryMaterials, (material) => material.totalCost || material.quantity * material.unitCost);

  const totalCategoryCount = [factoryEntries.length > 0, fabricMaterials.length > 0, subsidiaryMaterials.length > 0].filter(Boolean).length;
  const totalAmount = factoryAmountTotal + fabricAmountTotal + subsidiaryAmountTotal;
  const totalQuantity = factoryQuantityTotal + fabricQuantityTotal + subsidiaryQuantityTotal;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-5xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
      bodyClassName="space-y-4 bg-stone-50"
      footer={renderModalFooterActions({
        layout: "stack-reverse",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, className: "transition py-2.5" },
        primary: {
          label: requested ? (copy.requestedBadge ?? "발주 완료") : MODAL_ACTION_LABELS.proceedOrderRequest,
          onClick: () => onConfirm({ factoryName: confirmedFactoryName, quantity: confirmedQuantity }),
          tone: "primary",
          disabled: !canSubmit,
          className: "transition py-2.5",
        },
      })}
    >
      <div className="space-y-4 text-sm text-stone-700">
        <SectionCard title="발주 요약" badge={requested ? (copy.requestedBadge ?? "발주 완료") : "확인 필요"}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryStat label="작업지시서" value={workOrder.displayTitle || workOrder.title || "-"} />
            <SummaryStat label="대상 카테고리" value={formatCount(totalCategoryCount, "개") } />
            <SummaryStat label="총 수량" value={formatQuantity(totalQuantity) === "-" ? "0" : formatQuantity(totalQuantity)} />
            <SummaryStat label="총 금액" value={formatCurrency(totalAmount)} />
            <SummaryStat label="첨부파일" value={formatCount(attachmentItems.length, "개")} />
          </div>
        </SectionCard>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <SectionCard title="공장 발주" badge={formatCount(factoryEntries.length)}>
              <div className="space-y-3">
                <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="text-stone-500">공장</div>
                    <div className="mt-1 font-semibold text-stone-900">{confirmedFactoryName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-stone-500">납기일</div>
                    <div className="mt-1 font-semibold text-stone-900">{confirmedDueDate || "-"}</div>
                  </div>
                  <div>
                    <div className="text-stone-500">총 수량</div>
                    <div className="mt-1 font-semibold text-stone-900">{formatQuantity(factoryQuantityTotal)}</div>
                  </div>
                  <div>
                    <div className="text-stone-500">총 금액</div>
                    <div className="mt-1 font-semibold text-stone-900">{formatCurrency(factoryAmountTotal)}</div>
                  </div>
                </div>

                {factoryEntries.length > 0 ? (
                  <div className="space-y-2">
                    {factoryEntries.map((entry) => (
                      <FactoryEntryRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                    공장 발주 정보가 없습니다.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="원단 발주" badge={formatCount(fabricMaterials.length)}>
              <div className="space-y-3">
                <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
                  <KeyValueRow label="자재 건수" value={formatCount(fabricMaterials.length)} />
                  <KeyValueRow label="총 수량" value={formatQuantity(fabricQuantityTotal)} />
                  <KeyValueRow label="총 금액" value={formatCurrency(fabricAmountTotal)} />
                </div>

                {fabricMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {fabricMaterials.map((material) => (
                      <MaterialRow key={material.id} material={material} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                    원단 발주 정보가 없습니다.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="부자재 발주" badge={formatCount(subsidiaryMaterials.length)}>
              <div className="space-y-3">
                <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
                  <KeyValueRow label="자재 건수" value={formatCount(subsidiaryMaterials.length)} />
                  <KeyValueRow label="총 수량" value={formatQuantity(subsidiaryQuantityTotal)} />
                  <KeyValueRow label="총 금액" value={formatCurrency(subsidiaryAmountTotal)} />
                </div>

                {subsidiaryMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {subsidiaryMaterials.map((material) => (
                      <MaterialRow key={material.id} material={material} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                    부자재 발주 정보가 없습니다.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="대표이미지" badge={representativeImage ? "선택됨" : "없음"}>
              {representativeImage ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                    <img src={representativeImage.url} alt={representativeImage.name} className="h-56 w-full object-cover" />
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
                    <div className="text-xs text-stone-500">대표 첨부파일</div>
                    <div className="mt-1 truncate text-sm font-semibold text-stone-900">{representativeImage.name}</div>
                    <div className="mt-1 text-xs text-stone-500">현재는 첫 이미지 기준으로 표시됩니다.</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
                  표시할 대표이미지가 없습니다.
                </div>
              )}
            </SectionCard>

            <SectionCard title="첨부파일 목록" badge={formatCount(attachmentItems.length, "개")}>
              {attachmentItems.length > 0 ? (
                <div className="space-y-2">
                  {attachmentItems.map((attachment) => {
                    const isRepresentative = representativeImage?.id === attachment.id;
                    return (
                      <div
                        key={attachment.id}
                        className={`rounded-2xl border px-3 py-3 ${isRepresentative ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-stone-900">{attachment.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                              <span className="rounded-full bg-white px-2 py-0.5 font-medium text-stone-600">{getAttachmentTypeBadge(attachment)}</span>
                              {isRepresentative ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">대표이미지</span>
                              ) : null}
                              <span>{attachment.scope === "memo" ? "메모 첨부" : "공식 첨부"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                  첨부파일이 없습니다.
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {requested ? (
          <div className="text-sm text-emerald-700">
            {copy.requestedNotice ?? "이미 발주 요청이 기록된 작업입니다. 중복 발주는 허용되지 않습니다."}
          </div>
        ) : (
          <div className="text-xs text-stone-500">
            {copy.confirmNotice ?? "수정이 필요하면 모달을 닫고 발주정보에서 먼저 수정해주세요."}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
