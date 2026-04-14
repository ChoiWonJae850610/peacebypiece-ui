"use client";

type StatusToggleSize = "sm" | "md";

type StatusToggleProps = {
  checked: boolean;
  onChange?: (nextValue: boolean) => void;
  disabled?: boolean;
  srLabel?: string;
  className?: string;
  size?: StatusToggleSize;
};

const SIZE_CLASS_MAP: Record<StatusToggleSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: "h-6 w-11",
    thumb: "h-4 w-4",
    translate: "translate-x-5",
  },
  md: {
    track: "h-7 w-12",
    thumb: "h-5 w-5",
    translate: "translate-x-5",
  },
};

export default function StatusToggle({
  checked,
  onChange,
  disabled = false,
  srLabel,
  className = "",
  size = "sm",
}: StatusToggleProps) {
  const handleClick = () => {
    if (disabled || !onChange) return;
    onChange(!checked);
  };

  const sizeClass = SIZE_CLASS_MAP[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={srLabel ?? "상태 토글"}
      disabled={disabled}
      onClick={handleClick}
      className={[
        "relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200 ease-out",
        sizeClass.track,
        checked ? "border-stone-900 bg-stone-900" : "border-stone-300 bg-stone-200",
        disabled ? "cursor-default opacity-70" : "cursor-pointer hover:border-stone-500",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
          sizeClass.thumb,
          checked ? sizeClass.translate : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
