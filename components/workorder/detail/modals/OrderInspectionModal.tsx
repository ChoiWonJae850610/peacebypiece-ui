import { useEffect, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { DEFAULT_FACTORY_OPTION } from "@/lib/constants/workorderOptions";
import { toNumber } from "@/lib/workorder/detailSanitizers";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

export default function OrderInspectionModal({
  open,
  orderEntries,
  currentInventoryQuantity,
  onClose,
  onApply,
}: {
  open: boolean;
  orderEntries: OrderEntryState[];
  currentInventoryQuantity: number;
  onClose: () => void;
  onApply: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const pendingEntries = orderEntries.filter((item) => item.inspectionStatus !== "inspection_completed");
  const availableEntries = pendingEntries.length > 0 ? pendingEntries : orderEntries;
  const [selectedFactory, setSelectedFactory] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [inspectionMemo, setInspectionMemo] = useState("");
  const [appliedQuantityInput, setAppliedQuantityInput] = useState("");

  useModalEnvironment({ open, dialogRef, onClose });

  const factoryOptions = Array.from(new Set(availableEntries.map((item) => item.factory || DEFAULT_FACTORY_OPTION)));
  const resolvedFactory = factoryOptions.includes(selectedFactory) ? selectedFactory : (factoryOptions[0] ?? "");
  const filteredEntries = availableEntries.filter((item) => (item.factory || DEFAULT_FACTORY_OPTION) === resolvedFactory);
  const selectedEntry = filteredEntries.find((item) => item.id === selectedOrderId) ?? filteredEntries[0] ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedFactory("");
      setSelectedOrderId("");
      setInspectionMemo("");
      setAppliedQuantityInput("");
      return;
    }

    if (!resolvedFactory) return;
    if (selectedFactory !== resolvedFactory) {
      setSelectedFactory(resolvedFactory);
    }
    if (!selectedEntry) return;
    if (selectedOrderId !== selectedEntry.id) {
      setSelectedOrderId(selectedEntry.id);
    }
  }, [open, resolvedFactory, selectedFactory, selectedEntry, selectedOrderId]);

  useEffect(() => {
    if (!open || !selectedEntry) return;
    setAppliedQuantityInput(String(Math.max(0, Number(selectedEntry.quantity) || 0)));
  }, [open, selectedEntry?.id]);

  const handleFactoryChange = (factory: string) => {
    setSelectedFactory(factory);
    const nextEntries = availableEntries.filter((item) => (item.factory || DEFAULT_FACTORY_OPTION) === factory);
    setSelectedOrderId(nextEntries[0]?.id || "");
  };

  const orderedQuantity = Math.max(0, Number(selectedEntry?.quantity) || 0);
  const appliedQuantity = Math.max(0, toNumber(appliedQuantityInput));
  const nextInventoryQuantity = Math.max(0, Number(currentInventoryQuantity) || 0) + appliedQuantity;

  const handleApply = () => {
    if (!selectedEntry) return;
    onApply({
      orderEntryId: selectedEntry.id,
      inboundQuantity: appliedQuantity,
      nextInventoryQuantity,
      memo: inspectionMemo,
    });
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="order-inspection-modal-title" maxWidthClassName="md:max-w-lg">
      <ModalHeader
        titleId="order-inspection-modal-title"
        title="검수 진행"
        description="공장을 선택한 뒤 실제 검수 반영 수량을 입력하고 메모와 함께 완료 처리합니다."
        onClose={onClose}
      />
      <ModalBody>
        {selectedEntry ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-xs text-stone-500">공장</div>
                <select
                  value={resolvedFactory}
                  onChange={(event) => handleFactoryChange(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
                >
                  {factoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-xs text-stone-500">발주 유형</div>
                <select
                  value={selectedEntry.id}
                  onChange={(event) => setSelectedOrderId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
                >
                  {filteredEntries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.type} · {item.quantity.toLocaleString()}장
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div className="text-xs text-stone-500">발주 수량</div>
                <div className="mt-1 text-base font-semibold text-stone-900">{orderedQuantity.toLocaleString()}장</div>
              </div>
              <label className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-xs text-stone-500">검수 반영 수량</div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={appliedQuantityInput}
                  onChange={(event) => setAppliedQuantityInput(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
                />
              </label>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div className="text-xs text-stone-500">적용 후 재고</div>
                <div className="mt-1 text-base font-semibold text-stone-900">{nextInventoryQuantity.toLocaleString()}장</div>
              </div>
            </div>

            <label className="block rounded-2xl border border-stone-200 bg-white p-3">
              <div className="text-xs text-stone-500">검수 메모</div>
              <textarea
                value={inspectionMemo}
                onChange={(event) => setInspectionMemo(event.target.value)}
                rows={4}
                placeholder="검수 결과나 특이사항을 남겨주세요."
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
              />
            </label>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            검수할 발주 항목이 없습니다.
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="pbp-interactive-button flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedEntry}
            className="pbp-interactive-button flex-1 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            검수 완료
          </button>
        </div>
      </ModalFooter>
    </BaseModal>
  );
}
