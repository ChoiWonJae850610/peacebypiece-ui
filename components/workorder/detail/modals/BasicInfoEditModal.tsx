import { useI18n } from "@/lib/i18n";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { CATEGORY1_OPTIONS, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";
import { formatBasicSummary } from "@/lib/workorder/detail/detailFormatting";
import { getCategory2Options, getCategory3Options } from "@/lib/workorder/detail/detailSanitizers";
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
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.modals.basicInfo;
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
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-xl"
      footer={renderModalFooterActions({
        layout: "split",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, width: "fill" },
        primary: { label: MODAL_ACTION_LABELS.apply, onClick: onSave, tone: "primary", width: "fill" },
      })}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="rounded-2xl border border-stone-200 bg-white p-3">
          <div className="text-xs text-stone-500">{copy.category1}</div>
          <select
            value={value.category1}
            onChange={(event) => handleCategory1Change(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
          >
            {CATEGORY1_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="rounded-2xl border border-stone-200 bg-white p-3">
          <div className="text-xs text-stone-500">{copy.category2}</div>
          <select
            value={value.category2}
            onChange={(event) => handleCategory2Change(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
          >
            {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="rounded-2xl border border-stone-200 bg-white p-3">
          <div className="text-xs text-stone-500">{copy.category3}</div>
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
            <div className="text-xs text-stone-500">{copy.season}</div>
            <select
              value={value.season}
              onChange={(event) => onChange({ ...value, season: event.target.value })}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {SEASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">{copy.year}</div>
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
        <div className="text-xs text-stone-500">{copy.previewLabel}</div>
        <div className="mt-2 text-sm font-medium text-stone-900">{formatBasicSummary(value)}</div>
      </div>
    </ModalShell>
  );
}
