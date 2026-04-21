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
import { getWorkspaceCompanyName } from "@/lib/constants/company";
import {
  MATERIAL_KIND,
  ORDER_ENTRY_TARGET_TYPE,
} from "@/lib/constants/workorderDomain";
import type { Attachment, Material, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";

function formatCurrency(value: number) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `${numeric.toLocaleString()}원`;
}

function formatCurrencyCompact(value: number) {
  const numeric = Math.max(0, Number(value ?? 0) || 0);
  return numeric.toLocaleString();
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

function FieldBox({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`border border-stone-400 bg-white ${className}`.trim()}>
      <div className="border-b border-stone-300 bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-700">{label}</div>
      <div className="min-h-[42px] px-2 py-2 text-sm font-semibold text-stone-900">{value}</div>
    </div>
  );
}

function SummaryTableRow({
  vendor,
  name,
  quantity,
  unit,
  unitCost,
  totalCost,
}: {
  vendor: string;
  name: string;
  quantity: string;
  unit: string;
  unitCost: string;
  totalCost: string;
}) {
  return (
    <tr className="border-b border-stone-200 last:border-b-0">
      <td className="px-2 py-2 text-center align-top">{vendor}</td>
      <td className="px-2 py-2 align-top">{name}</td>
      <td className="px-2 py-2 text-center align-top">{quantity}</td>
      <td className="px-2 py-2 text-center align-top">{unit}</td>
      <td className="px-2 py-2 text-right align-top">{unitCost}</td>
      <td className="px-2 py-2 text-right align-top">{totalCost}</td>
    </tr>
  );
}

function SectionTable({
  title,
  columns,
  children,
  footerLabel,
  footerValue,
  emptyLabel,
}: {
  title: string;
  columns: string[];
  children: React.ReactNode;
  footerLabel: string;
  footerValue: string;
  emptyLabel: string;
}) {
  return (
    <section className="overflow-hidden border border-stone-400 bg-white">
      <div className="border-b border-stone-400 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs text-stone-800">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50">
              {columns.map((column) => (
                <th key={column} className="px-2 py-2 text-center font-semibold text-stone-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
          <tfoot>
            <tr className="border-t border-stone-300 bg-stone-50">
              <td colSpan={columns.length - 1} className="px-2 py-2 text-right font-semibold text-stone-700">
                {footerLabel}
              </td>
              <td className="px-2 py-2 text-right font-bold text-stone-900">{footerValue}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {children ? null : <div className="px-3 py-4 text-center text-sm text-stone-500">{emptyLabel}</div>}
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
        <SummaryTableRow
          key={material.id}
          vendor={material.vendor || "-"}
          name={material.name || "-"}
          quantity={formatQuantity(material.quantity)}
          unit={material.unit || "-"}
          unitCost={formatCurrencyCompact(material.unitCost)}
          totalCost={formatCurrencyCompact(material.totalCost || material.quantity * material.unitCost)}
        />
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
          <td className="px-2 py-2 text-center align-top">{item.vendor || "-"}</td>
          <td className="px-2 py-2 align-top">{item.process || "-"}</td>
          <td className="px-2 py-2 text-center align-top">{formatQuantity(item.quantity)}</td>
          <td className="px-2 py-2 text-right align-top">{formatCurrencyCompact(item.unitCost)}</td>
          <td className="px-2 py-2 text-right align-top">{formatCurrencyCompact(item.totalCost)}</td>
        </tr>
      ))}
    </>
  );
}

function LaborTableRows({ entries }: { entries: OrderEntry[] }) {
  if (entries.length === 0) {
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
      {entries.map((entry) => (
        <tr key={entry.id} className="border-b border-stone-200 last:border-b-0">
          <td className="px-2 py-2 text-center align-top">{entry.factory?.trim() || "-"}</td>
          <td className="px-2 py-2 align-top">공임</td>
          <td className="px-2 py-2 text-center align-top">{formatDateLabel(entry.dueDate)}</td>
          <td className="px-2 py-2 text-center align-top">{formatQuantity(entry.quantity)}</td>
          <td className="px-2 py-2 text-right align-top">{formatCurrencyCompact(entry.laborCost)}</td>
          <td className="px-2 py-2 text-right align-top">{formatCurrencyCompact(entry.laborCost * Math.max(1, entry.quantity > 0 ? 1 : 1))}</td>
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

  const customerName = getWorkspaceCompanyName();
  const displayTitle = workOrder.displayTitle || workOrder.title || "-";
  const styleNumber = workOrder.id || "-";

  const factoryQuantityTotal = sumBy(factoryEntries, (entry) => entry.quantity);
  const factoryLaborCostTotal = sumBy(factoryEntries, (entry) => entry.laborCost);
  const factoryLossCostTotal = sumBy(factoryEntries, (entry) => entry.lossCost);
  const fabricAmountTotal = sumBy(fabricMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const subsidiaryAmountTotal = sumBy(subsidiaryMaterials, (material) => material.totalCost || material.quantity * material.unitCost);
  const outsourcingAmountTotal = sumBy(workOrder.outsourcing ?? [], (item) => item.totalCost);
  const totalAmountWithoutLoss = factoryLaborCostTotal + fabricAmountTotal + subsidiaryAmountTotal + outsourcingAmountTotal;
  const totalAttachmentCount = attachmentItems.length;
  const memoLikeText = workOrder.memo?.trim();

  const attachmentSummaryLines = attachmentItems.map((attachment) => {
    const prefix = attachment.scope === "memo" ? "메모" : "첨부";
    return `${prefix} · ${getAttachmentTypeBadge(attachment)} · ${attachment.name}`;
  });

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
        <div className="border-b border-stone-400 px-4 py-4 text-center">
          <div className="text-[28px] font-black tracking-[0.25em] text-stone-900">작 업 지 시 서</div>
          <div className="mt-2 text-xs font-medium text-stone-500">발주서형 미리보기</div>
        </div>

        <div className="grid grid-cols-2 border-b border-stone-400 sm:grid-cols-4 lg:grid-cols-7">
          <FieldBox label="납기일" value={formatDateLabel(confirmedDueDate)} />
          <FieldBox label="style no." value={styleNumber} />
          <FieldBox label="품명" value={displayTitle} />
          <FieldBox label="공장" value={confirmedFactoryName || "-"} />
          <FieldBox label="매장" value={customerName} />
          <FieldBox label="공임" value={formatCurrency(factoryLaborCostTotal)} />
          <FieldBox label="로스" value={formatCurrency(factoryLossCostTotal)} />
        </div>

        <div className="grid grid-cols-2 border-b border-stone-400 sm:grid-cols-4 lg:grid-cols-7">
          <FieldBox label="총합" value={formatCurrency(totalAmountWithoutLoss)} />
          <FieldBox label="총수량" value={formatQuantity(factoryQuantityTotal || confirmedQuantity)} />
          <FieldBox label="첨부수" value={formatCount(totalAttachmentCount, "개")} />
          <FieldBox label="원단합" value={formatCurrency(fabricAmountTotal)} />
          <FieldBox label="부자재합" value={formatCurrency(subsidiaryAmountTotal)} />
          <FieldBox label="외주합" value={formatCurrency(outsourcingAmountTotal)} />
          <FieldBox label="상태" value={requested ? (copy.requestedBadge ?? "발주 완료") : "확인 필요"} />
        </div>

        <div className="grid border-b border-stone-400 lg:grid-cols-[1.5fr_1fr]">
          <section className="border-b border-stone-400 lg:border-b-0 lg:border-r lg:border-stone-400">
            <div className="border-b border-stone-300 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">&lt; 대표 이미지 &gt;</div>
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
            <div className="border-b border-stone-300 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">&lt; 첨부파일 / 요청사항 &gt;</div>
            <div className="flex min-h-[448px] flex-col">
              <div className="flex-1 space-y-4 px-3 py-3 text-sm leading-6 text-stone-800">
                {memoLikeText ? (
                  <div>
                    <div className="mb-1 text-xs font-bold tracking-wide text-rose-700">요청사항</div>
                    <div className="whitespace-pre-wrap">{memoLikeText}</div>
                  </div>
                ) : null}

                <div>
                  <div className="mb-1 text-xs font-bold tracking-wide text-stone-700">첨부파일 목록</div>
                  {attachmentSummaryLines.length > 0 ? (
                    <ol className="space-y-1 pl-5">
                      {attachmentSummaryLines.map((line, index) => (
                        <li key={`${line}-${index}`} className="list-decimal break-all">
                          {line}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-stone-500">첨부파일이 없습니다.</div>
                  )}
                </div>
              </div>
              <div className="border-t border-stone-300 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-800">
                총 첨부파일 수 {formatCount(totalAttachmentCount, "개")}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 bg-[#fcfaf5] p-4">
          <SectionTable
            title="원단 내역"
            columns={["거래처", "자재명", "수량", "단위", "단가", "금액"]}
            footerLabel="원단 총합"
            footerValue={formatCurrency(fabricAmountTotal)}
            emptyLabel="원단 발주 정보가 없습니다."
          >
            <MaterialTableRows materials={fabricMaterials} />
          </SectionTable>

          <SectionTable
            title="부자재 내역"
            columns={["거래처", "자재명", "수량", "단위", "단가", "금액"]}
            footerLabel="부자재 총합"
            footerValue={formatCurrency(subsidiaryAmountTotal)}
            emptyLabel="부자재 발주 정보가 없습니다."
          >
            <MaterialTableRows materials={subsidiaryMaterials} />
          </SectionTable>

          <SectionTable
            title="외주 내역"
            columns={["외주처", "작업명", "수량", "단가", "금액"]}
            footerLabel="외주 총합"
            footerValue={formatCurrency(outsourcingAmountTotal)}
            emptyLabel="외주 정보가 없습니다."
          >
            <OutsourcingTableRows outsourcingItems={workOrder.outsourcing ?? []} />
          </SectionTable>

          <SectionTable
            title="공임 내역"
            columns={["공장", "공임 항목", "납기일", "수량", "단가", "금액"]}
            footerLabel="공임 총합"
            footerValue={formatCurrency(factoryLaborCostTotal)}
            emptyLabel="공임 정보가 없습니다."
          >
            <LaborTableRows entries={factoryEntries} />
          </SectionTable>

          <section className="overflow-hidden border border-stone-400 bg-white">
            <div className="border-b border-stone-400 bg-stone-100 px-3 py-2 text-sm font-bold text-stone-900">총합 요약 (로스 제외)</div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs text-stone-800">
                <thead>
                  <tr className="border-b border-stone-300 bg-stone-50">
                    {[
                      "원단 총합",
                      "부자재 총합",
                      "외주 총합",
                      "공임 총합",
                      "총합 (로스 제외)",
                      "로스",
                    ].map((label) => (
                      <th key={label} className="px-2 py-2 text-center font-semibold text-stone-700">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-3 text-center font-semibold">{formatCurrency(fabricAmountTotal)}</td>
                    <td className="px-2 py-3 text-center font-semibold">{formatCurrency(subsidiaryAmountTotal)}</td>
                    <td className="px-2 py-3 text-center font-semibold">{formatCurrency(outsourcingAmountTotal)}</td>
                    <td className="px-2 py-3 text-center font-semibold">{formatCurrency(factoryLaborCostTotal)}</td>
                    <td className="px-2 py-3 text-center font-bold text-stone-900">{formatCurrency(totalAmountWithoutLoss)}</td>
                    <td className="px-2 py-3 text-center font-semibold">{formatCurrency(factoryLossCostTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
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
