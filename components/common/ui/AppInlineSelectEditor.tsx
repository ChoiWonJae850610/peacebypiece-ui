import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export type AppInlineSelectEditorOption = {
  value: string;
  label?: string;
  disabled?: boolean;
};

type AppInlineSelectEditorProps = {
  value: string;
  options: AppInlineSelectEditorOption[];
  onCommit: (value: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function AppInlineSelectEditor({
  value,
  options,
  onCommit,
  onCancel,
  autoFocus = true,
  className,
  ariaLabel = "선택값 편집",
}: AppInlineSelectEditorProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit(event.currentTarget.value);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <select
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onCommit(event.target.value)}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "pbp-field-interaction pbp-workorder-editable-input block w-full min-w-0 max-w-full overflow-hidden rounded-lg border px-2 outline-none ring-0",
        "min-h-8 appearance-none whitespace-nowrap pr-6 text-xs",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label ?? option.value}
        </option>
      ))}
    </select>
  );
}
