import ModalShell from "@/components/common/modal/ModalShell";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster";
import type { OutsourcingProcessType } from "@/types/partner";

type PartnerProcessDeleteModalProps = {
  deletingProcessType: OutsourcingProcessType | null;
  orderedProcessDefinitions: OutsourcingProcessDefinition[];
  onClose: () => void;
  onConfirm: () => void;
};

export default function PartnerProcessDeleteModal({
  deletingProcessType,
  orderedProcessDefinitions,
  onClose,
  onConfirm,
}: PartnerProcessDeleteModalProps) {
  const deletingLabel = deletingProcessType
    ? orderedProcessDefinitions.find((definition) => definition.type === deletingProcessType)?.label ?? deletingProcessType
    : null;

  return (
    <ModalShell
      open={Boolean(deletingProcessType)}
      onClose={onClose}
      title="외주공정 삭제"
      description="삭제하면 해당 공정을 사용하는 외주 설정에서도 함께 제거된다."
      maxWidthClass="md:max-w-lg"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            삭제
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
        {deletingLabel ? `외주공정 "${deletingLabel}"을(를) 삭제할까요?` : "삭제할 외주공정을 찾을 수 없다."}
      </div>
    </ModalShell>
  );
}
