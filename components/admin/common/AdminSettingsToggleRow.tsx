"use client";

import AdminUsageToggle from "@/components/admin/common/AdminUsageToggle";

type AdminSettingsToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
};

export default function AdminSettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  activeLabel = "사용",
  inactiveLabel = "미사용",
  className = "",
}: AdminSettingsToggleRowProps) {
  return (
    <div
      className={[
        "flex min-h-[64px] items-center justify-between gap-3 wafl-shape-surface border border-stone-200 bg-white px-4 py-3 text-left transition",
        disabled ? "opacity-75" : "hover:border-stone-300",
        className,
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-950">{label}</p>
        {description ? <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">{description}</p> : null}
      </div>
      <AdminUsageToggle
        label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        variant="inline"
      />
    </div>
  );
}
