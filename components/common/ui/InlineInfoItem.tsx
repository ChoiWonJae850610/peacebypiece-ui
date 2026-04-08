import type { ReactNode } from "react";

type InlineInfoItemProps = {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  valueClassName?: string;
};

export default function InlineInfoItem({ label, value, onClick, valueClassName = "text-stone-900" }: InlineInfoItemProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="pbp-interactive-button inline-flex items-center bg-transparent p-0 text-sm font-medium text-stone-700 underline-offset-2 hover:text-stone-900 hover:underline"
      >
        {label} <span className={`ml-1 ${valueClassName}`}>{value}</span>
      </button>
    );
  }

  return (
    <span>
      {label} <span className={`font-medium ${valueClassName}`}>{value}</span>
    </span>
  );
}
