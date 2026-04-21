"use client";

import { useMemo } from "react";
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
} from "@/lib/constants/workorderDomain";
import type { Attachment, Material, Outsourcing, WorkOrder } from "@/types/workorder";

function formatCurrency(value: number) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `${numeric.toLocaleString()}원`;
}

function formatQuantity(value: number, suffix?: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return suffix ? `${numeric.toLocaleString()} ${suffix}` : numeric.toLocaleString();
}

function formatDateLabel(value?: string | null) {
  const text = value?.trim();
  if (!text) return "-";
  return text;
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

function SummaryLine({
  items,
  className = "",
}: {
  items: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <div className={`border-b border-stone-400 px-4 py-3 ${className}`.trim()}>
      <div className="grid gap-x-5 gap-y-2 text-sm text-stone-800 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2 border-b border-dashed border-stone-200 pb-2 last:border-b-0 md:pb-0 md:border-b-0">
            <span className="shrink-0 text-xs font-semibold tracking-wide text-stone-500">{item.label}</span>
            <span className="min-w-0 flex-1 text-right text-sm font-semibold text-stone-900 break-words">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTable({
  title,
  columns,
  children,
  footerLabel,
  footerValue,
}: {
  title: string;
  columns: Array<{ label: string; className?: string }>;
  children: React.ReactNode;
  footerLabel: string;
  footerValue: string;
}) {
  return (
    <section className="overflow-hidden border border-stone-400 bg-white">
      <div className="border-b border-stone-400 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse text-xs text-stone-800">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50">
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={`px-2 py-2 text-center font-semibold text-stone-700 ${column.className ?? ""}`.trim()}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
          <tfoot>
            <tr className="border-t border-stone-300 bg-stone-50">
              <td colSpan={columns.length - 1} className="px-2 py-2 text-center font-semibold text-stone-700">
                {footerLabel}
              </td>
              <td className="px-2 py-2 text-center font-bold text-stone-900">{footerValue}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function MaterialTableRows({ materials }: { materials: Material[] }) {
  if (materials.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="px-3 py-5 text-center text-sm text-stone-500">
          항목이 없습니다.
        </td>
      </tr>
    );
  }

  return (
    <>
      {materials.map((material) => (
        <tr key={material.id} className="border-b border-stone-200 last:border-b-0">
          <td className="px-2 py-2 text-center align-middle">{material.vendor || "-"}</td>
          <td className="px-2 py-2 text-center align-middle break-words">{material.name || "-"}</td>
          <td className="px-2 py-2 text-center align-middle">{formatQuantity(material.quantity)}</td>
          <td className="px-2 py-2 text-center align-middle">{material.unit || "-"}</td>
          <td className="px-2 py-2 text-center align-middle">{formatCurrency(material.unitCost)}</td>
          <td className="px-2 py-2 text-center align-middle">
            {formatCurrency(material.totalCost || material.quantity * material.unitCost)}
          </td>
        </tr>
      ))}
    </>
  );
}

function OutsourcingTableRows({ outsourcingItems }: { outsourcingItems: Outsourcing[] }) {
  if (outsourcingItems.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-3 py-5 text-center text-sm text-stone-500">
          항목이 없습니다.
        </td>
      </tr>
    );
  }

  return (
    <>
      {outsourcingItems.map((item) => (
        <tr key={item.id} className="border-b border-stone-200 last:border-b-0">
          <td className="px-2 py-2 text-center align-middle">{item.vendor || "-"}</td>
          <td className="px-2 py-2 text-center align-middle break-words">{item.process || "-"}</td>
          <td className="px-2 py-2 text-center align-middle">{formatQuantity(item.quantity)}</td>
          <td className="px-2 py-2 text-center align-middle">{formatCurrency(item.unitCost)}</td>
          <td className="px-2 py-2 text-center align-middle">{formatCurrency(item.totalCost)}</td>
        </tr>
      ))}
    </>
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

  const displayTitle = workOrder.displayTitle || workOrder.title || "-";

  const factoryQuantityTotal = sumBy(factoryEntries, (entry) => entry.quantity);
  const factoryLaborCostTotal = sumBy(factoryEntries, (entry) => entry.laborCost);
  const factoryLossCostTotal = sumBy(factoryEntries, (entry) => entry.lossCost);
  const fabricAmountTotal = sumBy(fabricMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const subsidiaryAmountTotal = sumBy(subsidiaryMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const outsourcingAmountTotal = sumBy(workOrder.outsourcing ?? [], (item) => item.totalCost);
  const totalAmountWithoutLoss = factoryLaborCostTotal + fabricAmountTotal + subsidiaryAmountTotal + outsourcingAmountTotal;
  const memoLikeText = workOrder.memo?.trim();

  const attachmentSummaryLines = attachmentItems.map((attachment) => ({
    id: attachment.id,
    typeLabel: getAttachmentTypeBadge(attachment),
    scopeLabel: attachment.scope === "memo" ? "메모" : "첨부",
    name: attachment.name,
  }));

  const firstSummaryItems = [
    { label: "품명", value: displayTitle },
    { label: "공임", value: formatCurrency(factoryLaborCostTotal) },
    { label: "원가", value: formatCurrency(totalAmountWithoutLoss) },
    { label: "수량", value: formatQuantity(factoryQuantityTotal || confirmedQuantity) },
  ];

  const secondSummaryItems = [
    { label: "원단합", value: formatCurrency(fabricAmountTotal) },
    { label: "부자재합", value: formatCurrency(subsidiaryAmountTotal) },
    { label: "외주합", value: formatCurrency(outsourcingAmountTotal) },
    { label: "로스", value: formatCurrency(factoryLossCostTotal) },
  ];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-6xl"
      overlayClassName="bg-stone-950/55 md:bg-stone-950/50"
      bodyClassName="bg-[#f5f2eb]"
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
      <div className="mx-auto w-full max-w-[1040px] rounded-sm border border-stone-500 bg-white text-stone-900 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="border-b border-stone-400 px-4 py-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div className="min-w-0 pt-1 text-left">
              <div className="text-[11px] font-semibold tracking-wide text-stone-500">납기일</div>
              <div className="mt-1 text-sm font-semibold text-stone-900">{formatDateLabel(confirmedDueDate)}</div>
            </div>
            <div className="min-w-0 text-center">
              <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
                <div className="text-[26px] font-black tracking-[0.22em] text-stone-900">작 업 지 시 서</div>
                <div className="max-w-[240px] truncate text-xs font-semibold text-stone-500">{confirmedFactoryName || "공장 미지정"}</div>
              </div>
              <div className="mt-2 text-lg font-bold text-stone-900">{displayTitle}</div>
            </div>
            <div className="pt-1 text-right">
              <div className="text-[11px] font-semibold tracking-wide text-stone-400">문서 상태</div>
              <div className={`mt-1 text-sm font-semibold ${requested ? "text-emerald-700" : "text-stone-600"}`}>
                {requested ? (copy.requestedBadge ?? "발주 완료") : "발주 확인"}
              </div>
            </div>
          </div>
        </div>

        <SummaryLine items={firstSummaryItems} />
        <SummaryLine items={secondSummaryItems} className="bg-stone-50" />

        <div className="grid border-b border-stone-400 lg:grid-cols-[1.45fr_1fr]">
          <section className="border-b border-stone-400 lg:border-b-0 lg:border-r lg:border-stone-400">
            <div className="border-b border-stone-300 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">대표 이미지</div>
            <div className="bg-[#fcfaf5] p-3">
              {representativeImage ? (
                <div className="overflow-hidden border border-stone-300 bg-stone-100">
                  <img src={representativeImage.url} alt={representativeImage.name} className="h-[420px] w-full object-contain bg-white" />
                </div>
              ) : (
                <div className="flex h-[420px] items-center justify-center border border-dashed border-stone-300 bg-white text-sm text-stone-500">
                  대표 이미지가 없습니다.
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="border-b border-stone-300 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">첨부파일 / 요청사항</div>
            <div className="flex min-h-[448px] flex-col">
              <div className="flex-1 space-y-5 px-3 py-3 text-sm leading-6 text-stone-800">
                <div>
                  <div className="mb-2 text-xs font-bold tracking-wide text-stone-700">첨부파일 목록</div>
                  {attachmentSummaryLines.length > 0 ? (
                    <div className="space-y-2">
                      {attachmentSummaryLines.map((attachment, index) => (
                        <div key={attachment.id} className="grid grid-cols-[auto_auto_1fr] items-start gap-2 border border-stone-200 bg-white px-2 py-2 text-sm">
                          <span className="text-stone-500">{index + 1}.</span>
                          <span className="rounded border border-stone-300 bg-stone-50 px-1.5 py-0.5 text-[11px] font-semibold text-stone-600">
                            {attachment.typeLabel}
                          </span>
                          <div className="min-w-0 break-all">
                            <span className="mr-2 text-xs font-semibold text-stone-500">{attachment.scopeLabel}</span>
                            <span>{attachment.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-stone-300 bg-white px-3 py-4 text-stone-500">첨부파일이 없습니다.</div>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold tracking-wide text-rose-700">요청사항</div>
                  <div className="min-h-[148px] border border-stone-300 bg-white px-3 py-3 whitespace-pre-wrap">
                    {memoLikeText || "요청사항이 없습니다."}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 bg-[#fcfaf5] p-4">
          <SectionTable
            title="원단 내역"
            columns={[
              { label: "거래처", className: "w-[18%]" },
              { label: "자재명", className: "w-[28%]" },
              { label: "수량", className: "w-[12%]" },
              { label: "단위", className: "w-[10%]" },
              { label: "단가", className: "w-[16%]" },
              { label: "금액", className: "w-[16%]" },
            ]}
            footerLabel="원단 총합"
            footerValue={formatCurrency(fabricAmountTotal)}
          >
            <MaterialTableRows materials={fabricMaterials} />
          </SectionTable>

          <SectionTable
            title="부자재 내역"
            columns={[
              { label: "거래처", className: "w-[18%]" },
              { label: "자재명", className: "w-[28%]" },
              { label: "수량", className: "w-[12%]" },
              { label: "단위", className: "w-[10%]" },
              { label: "단가", className: "w-[16%]" },
              { label: "금액", className: "w-[16%]" },
            ]}
            footerLabel="부자재 총합"
            footerValue={formatCurrency(subsidiaryAmountTotal)}
          >
            <MaterialTableRows materials={subsidiaryMaterials} />
          </SectionTable>

          <SectionTable
            title="외주 내역"
            columns={[
              { label: "외주처", className: "w-[24%]" },
              { label: "작업명", className: "w-[28%]" },
              { label: "수량", className: "w-[14%]" },
              { label: "단가", className: "w-[17%]" },
              { label: "금액", className: "w-[17%]" },
            ]}
            footerLabel="외주 총합"
            footerValue={formatCurrency(outsourcingAmountTotal)}
          >
            <OutsourcingTableRows outsourcingItems={workOrder.outsourcing ?? []} />
          </SectionTable>
        </div>

        {requested ? (
          <div className="border-t border-stone-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {copy.requestedNotice ?? "이미 발주 요청이 기록된 작업입니다. 중복 발주는 허용되지 않습니다."}
          </div>
        ) : (
          <div className="border-t border-stone-300 bg-stone-50 px-4 py-3 text-xs text-stone-500">
            {copy.confirmNotice ?? "수정이 필요하면 모달을 닫고 발주정보에서 먼저 수정해주세요."}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
