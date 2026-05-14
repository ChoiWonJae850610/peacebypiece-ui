import { MODAL_SELECT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import type { CategoryOption } from "@/components/common/modal/createWorkOrder/createWorkOrderCategorySource";

type Props = {
  disabled?: boolean;
  labels: {
    category1: string;
    category2: string;
    category3: string;
  };
  values: {
    category1: string;
    category2: string;
    category3: string;
  };
  options: {
    category1Options: CategoryOption[];
    category2Options: CategoryOption[];
    category3Options: CategoryOption[];
  };
  onChange: {
    category1: (value: string) => void;
    category2: (value: string) => void;
    category3: (value: string) => void;
  };
};

function renderCategoryOptions(options: CategoryOption[]) {
  return options.map((option) => (
    <option key={option.id ?? option.name} value={option.name}>
      {option.name}
    </option>
  ));
}

export default function CreateWorkOrderCategoryFields({ disabled = false, labels, values, options, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--pbp-text-secondary)]">{labels.category1}</span>
        <select value={values.category1} onChange={(event) => onChange.category1(event.target.value)} className={MODAL_SELECT_CLASS} disabled={disabled}>
          {renderCategoryOptions(options.category1Options)}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--pbp-text-secondary)]">{labels.category2}</span>
        <select value={values.category2} onChange={(event) => onChange.category2(event.target.value)} className={MODAL_SELECT_CLASS} disabled={disabled}>
          {renderCategoryOptions(options.category2Options)}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--pbp-text-secondary)]">{labels.category3}</span>
        <select value={values.category3} onChange={(event) => onChange.category3(event.target.value)} className={MODAL_SELECT_CLASS} disabled={disabled}>
          {renderCategoryOptions(options.category3Options)}
        </select>
      </label>
    </div>
  );
}
