import { AppSelect } from "@/components/common/ui";
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

function toCategorySelectOptions(options: CategoryOption[]) {
  return options.map((option) => ({
    value: option.name,
    label: option.name,
  }));
}

export default function CreateWorkOrderCategoryFields({ disabled = false, labels, values, options, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--pbp-text-secondary)]">{labels.category1}</span>
        <AppSelect
          value={values.category1}
          onValueChange={onChange.category1}
          options={toCategorySelectOptions(options.category1Options)}
          disabled={disabled}
          size="md"
          ariaLabel={labels.category1}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--pbp-text-secondary)]">{labels.category2}</span>
        <AppSelect
          value={values.category2}
          onValueChange={onChange.category2}
          options={toCategorySelectOptions(options.category2Options)}
          disabled={disabled}
          size="md"
          ariaLabel={labels.category2}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--pbp-text-secondary)]">{labels.category3}</span>
        <AppSelect
          value={values.category3}
          onValueChange={onChange.category3}
          options={toCategorySelectOptions(options.category3Options)}
          disabled={disabled}
          size="md"
          ariaLabel={labels.category3}
        />
      </label>
    </div>
  );
}
