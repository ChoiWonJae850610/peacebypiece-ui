import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { CATEGORY1_OPTIONS, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";
import { formatBasicSummary } from "@/lib/workorder/detailFormatting";
import { getCategory2Options, getCategory3Options } from "@/lib/workorder/detailSanitizers";
import type { BasicInfoState } from "@/components/workorder/detail/shared/detailEditorShared";

export default function BasicInfoEditModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  value: BasicInfoState;
  onChange: (next: BasicInfoState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });

  const category2Options = getCategory2Options(value.category1);
  const category3Options = getCategory3Options(value.category2);

  const handleCategory1Change = (category1: string) => {
    const nextCategory2Options = getCategory2Options(category1);
    const nextCategory2 = nextCategory2Options[0] ?? "";
    const nextCategory3Options = getCategory3Options(nextCategory2);
    onChange({
      ...value,
      category1,
      category2: nextCategory2,
      category3: nextCategory3Options[0] ?? "",
    });
  };

  const handleCategory2Change = (category2: string) => {
    const nextCategory3Options = getCategory3Options(category2);
    onChange({
      ...value,
      category2,
      category3: nextCategory3Options[0] ?? "",
    });
  };

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="basic-info-edit-modal-title" maxWidthClassName="md:max-w-xl">
      <ModalHeader
        titleId="basic-info-edit-modal-title"
        title="기본정보 수정"
        description="헤더 요약에 표시되는 품목 분류와 시즌 정보를 수정합니다."
        onClose={onClose}
      />
      <ModalBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">대분류</div>
            <select
              value={value.category1}
              onChange={(event) => handleCategory1Change(event.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {CATEGORY1_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">중분류</div>
            <select
              value={value.category2}
              onChange={(event) => handleCategory2Change(event.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">소분류</div>
            <select
              value={value.category3}
              onChange={(event) => onChange({ ...value, category3: event.target.value })}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {category3Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            <label className="rounded-2xl border border-stone-200 bg-white p-3">
              <div className="text-xs text-stone-500">시즌</div>
              <select
                value={value.season}
                onChange={(event) => onChange({ ...value, season: event.target.value })}
                className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
              >
                {SEASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="rounded-2xl border border-stone-200 bg-white p-3">
              <div className="text-xs text-stone-500">연도</div>
              <select
                value={value.year}
                onChange={(event) => onChange({ ...value, year: event.target.value })}
                className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
              >
                {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <div className="text-xs text-stone-500">헤더 요약 미리보기</div>
          <div className="mt-2 text-sm font-medium text-stone-900">{formatBasicSummary(value)}</div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="pbp-interactive-button flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            className="pbp-interactive-button flex-1 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black"
          >
            적용
          </button>
        </div>
      </ModalFooter>
    </BaseModal>
  );
}
