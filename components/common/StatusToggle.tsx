"use client";

type StatusToggleProps = {
  checked: boolean;
  onChange?: (nextValue: boolean) => void;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
  srLabel?: string;
  className?: string;
};

export default function StatusToggle({
  checked,
  onChange,
  disabled = false,
  onLabel = "ON",
  offLabel = "OFF",
  srLabel,
  className = "",
}: StatusToggleProps) {
  const handleClick = () => {
    if (disabled || !onChange) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={srLabel ?? `${onLabel}/${offLabel}`}
      disabled={disabled}
      onClick={handleClick}
      className={[
        "inline-flex h-9 min-w-[88px] items-center rounded-full border px-1.5 transition",
        checked
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-stone-100 text-stone-600",
        disabled ? "cursor-default opacity-70" : "cursor-pointer hover:border-stone-500",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-6 min-w-[40px] items-center justify-center rounded-full px-2 text-[11px] font-semibold transition",
          checked ? "bg-white text-stone-900 translate-x-0" : "bg-white text-stone-500 translate-x-[calc(100%-2px)]",
        ].join(" ")}
      >
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}
