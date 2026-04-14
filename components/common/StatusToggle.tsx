"use client";

type StatusToggleSize = "sm" | "md";

type StatusToggleProps = {
  checked: boolean;
  onChange?: (nextValue: boolean) => void;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
  srLabel?: string;
  className?: string;
  size?: StatusToggleSize;
};

const SIZE_CLASS_MAP: Record<StatusToggleSize, { track: string; thumb: string }> = {
  sm: {
    track: "h-7 min-w-[62px] px-1",
    thumb: "h-5 min-w-[28px] px-1.5 text-[10px]",
  },
  md: {
    track: "h-8 min-w-[72px] px-1",
    thumb: "h-6 min-w-[34px] px-2 text-[11px]",
  },
};

export default function StatusToggle({
  checked,
  onChange,
  disabled = false,
  onLabel = "ON",
  offLabel = "OFF",
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
      aria-label={srLabel ?? `${onLabel}/${offLabel}`}
      disabled={disabled}
      onClick={handleClick}
      className={[
        "inline-flex items-center rounded-full border transition",
        sizeClass.track,
        checked
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-stone-100 text-stone-600",
        disabled ? "cursor-default opacity-70" : "cursor-pointer hover:border-stone-500",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center justify-center rounded-full font-semibold transition",
          sizeClass.thumb,
          checked ? "bg-white text-stone-900" : "bg-white text-stone-500",
        ].join(" ")}
      >
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}
